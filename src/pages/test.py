from __future__ import annotations

import os
import re
import uuid
import requests
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv


load_dotenv()


EXPECTED_COLUMNS = [
    "name",
    "country",
    "company",
    "sector",
    "title",
    "linkedin_url",
    "photo_url",
]

REQUIRED_COLUMNS = [
    "name",
    "country",
    "company",
    "sector",
    "title",
    "linkedin_url",
]


class SupabaseTestError(Exception):
    pass


def make_slug(name: str) -> str:
    value = name.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-+", "-", value)
    return value.strip("-") or f"attendee-{uuid.uuid4().hex[:8]}"


@dataclass
class SupabaseConfig:
    url: str
    key: str
    attendees_table: str = "attendees"
    connections_table: str = "connections"

    @classmethod
    def from_env(cls) -> "SupabaseConfig":
        url = os.getenv("VITE_SUPABASE_URL")
        key = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")

        if not url or not key:
            raise SupabaseTestError(
                "Missing SUPABASE_URL or SUPABASE_KEY in environment."
            )

        return cls(
            url=url.rstrip("/"),
            key=key,
            attendees_table=os.getenv("ATTENDEES_TABLE", "attendees"),
            connections_table=os.getenv("CONNECTIONS_TABLE", "connections"),
        )


class SupabaseTestClient:
    def __init__(self, config: Optional[SupabaseConfig] = None):
        self.config = config or SupabaseConfig.from_env()
        self.base = f"{self.config.url}/rest/v1"
        self.headers = {
            "apikey": self.config.key,
            "Authorization": f"Bearer {self.config.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def _request(
        self,
        method: str,
        path: str,
        *,
        params: Optional[dict] = None,
        json: Any = None,
    ) -> Any:
        url = f"{self.base}/{path}"

        response = requests.request(
            method,
            url,
            headers=self.headers,
            params=params,
            json=json,
            timeout=30,
        )

        if not response.ok:
            raise SupabaseTestError(
                f"{method} {url} failed: "
                f"{response.status_code} {response.text}"
            )

        if not response.text:
            return None

        return response.json()

    def add_attendee(
        self,
        *,
        name: str,
        country: str,
        company: str,
        sector: str,
        title: str,
        linkedin_url: str,
        photo_url: Optional[str] = None,
        slug: Optional[str] = None,
        extra_fields: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        if "linkedin.com" not in linkedin_url:
            raise ValueError("linkedin_url must contain linkedin.com")

        row = {
            "name": name,
            "country": country,
            "company": company,
            "sector": sector,
            "title": title,
            "linkedin_url": linkedin_url,
            "photo_url": photo_url,
        }

        if slug:
            row["slug"] = slug
        else:
            row["slug"] = self.unique_slug(name)

        if extra_fields:
            row.update(extra_fields)

        result = self._request(
            "POST",
            self.config.attendees_table,
            json=[row],
        )

        return result[0]

    def unique_slug(self, name: str) -> str:
        base = make_slug(name)
        candidate = base
        counter = 2

        while self.get_attendee_by_slug(candidate, raise_if_missing=False):
            candidate = f"{base}-{counter}"
            counter += 1

        return candidate

    def list_attendees(self) -> List[Dict[str, Any]]:
        select = "id,slug," + ",".join(EXPECTED_COLUMNS)

        return self._request(
            "GET",
            self.config.attendees_table,
            params={
                "select": select,
                "order": "name.asc",
            },
        )

    def get_attendee_by_slug(
        self,
        slug: str,
        *,
        raise_if_missing: bool = True,
    ) -> Optional[Dict[str, Any]]:
        rows = self._request(
            "GET",
            self.config.attendees_table,
            params={
                "select": "*",
                "slug": f"eq.{slug}",
                "limit": "1",
            },
        )

        if rows:
            return rows[0]

        if raise_if_missing:
            raise SupabaseTestError(f"No attendee found with slug={slug}")

        return None

    def get_attendee_by_id(
        self,
        attendee_id: str,
        *,
        raise_if_missing: bool = True,
    ) -> Optional[Dict[str, Any]]:
        rows = self._request(
            "GET",
            self.config.attendees_table,
            params={
                "select": "*",
                "id": f"eq.{attendee_id}",
                "limit": "1",
            },
        )

        if rows:
            return rows[0]

        if raise_if_missing:
            raise SupabaseTestError(f"No attendee found with id={attendee_id}")

        return None

    def search_attendees(self, query: str) -> List[Dict[str, Any]]:
        query = query.strip()
        if not query:
            return self.list_attendees()

        or_filter = ",".join(
            f"{column}.ilike.*{query}*"
            for column in EXPECTED_COLUMNS
        )

        return self._request(
            "GET",
            self.config.attendees_table,
            params={
                "select": "*",
                "or": f"({or_filter})",
                "order": "name.asc",
            },
        )

    def delete_attendee(self, attendee_id: str) -> None:
        self._request(
            "DELETE",
            self.config.attendees_table,
            params={
                "id": f"eq.{attendee_id}",
            },
        )

    def delete_all_attendees(self) -> None:
        self._request(
            "DELETE",
            self.config.attendees_table,
            params={
                "id": "not.is.null",
            },
        )

    def add_connection(
    self,
    *,
    scanner_id: str,
    scanned_id: str,
    extra_fields: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
        if scanner_id == scanned_id:
            raise ValueError("Cannot connect attendee with themselves.")

        self.get_attendee_by_id(scanner_id)
        self.get_attendee_by_id(scanned_id)

        existing = self.find_connection(
            scanner_id=scanner_id,
            scanned_id=scanned_id,
        )

        if existing:
            return existing

        row = {
            "scanner_id": scanner_id,
            "scanned_id": scanned_id,
        }

        if extra_fields:
            row.update(extra_fields)

        result = self._request(
            "POST",
            self.config.connections_table,
            json=[row],
        )

        return result[0]

    def add_connection_by_slug(
        self,
        *,
        scanner_slug: str,
        scanned_slug: str,
        extra_fields: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        scanner = self.get_attendee_by_slug(scanner_slug)
        scanned = self.get_attendee_by_slug(scanned_slug)

        return self.add_connection(
            scanner_id=scanner["id"],
            scanned_id=scanned["id"],
            extra_fields=extra_fields,
        )

    def find_connection(
        self,
        *,
        scanner_id: str,
        scanned_id: str,
    ) -> Optional[Dict[str, Any]]:
        rows = self._request(
            "GET",
            self.config.connections_table,
            params={
                "select": "*",
                "or": (
                    f"(and(scanner_id.eq.{scanner_id},scanned_id.eq.{scanned_id}),"
                    f"and(scanner_id.eq.{scanned_id},scanned_id.eq.{scanner_id}))"
                ),
                "limit": "1",
            },
        )

        return rows[0] if rows else None

    def list_connections(self) -> List[Dict[str, Any]]:
        return self._request(
            "GET",
            self.config.connections_table,
            params={
                "select": "*",
                "order": "created_at.desc",
            },
        )

    def list_connections_for_attendee(
        self,
        attendee_id: str,
    ) -> List[Dict[str, Any]]:
        return self._request(
            "GET",
            self.config.connections_table,
            params={
                "select": "*",
                "or": f"(scanner_id.eq.{attendee_id},scanned_id.eq.{attendee_id})",
                "order": "created_at.desc",
            },
        )

firstNames = ["Hassan", "Sara", "Ali", "Aisha", "Omar", "Fatima", "Zain", "Maryam"]
lastNames = ["Abbas", "Khan", "Ahmed", "Hussain", "Yousuf", "Ali", "Hameed", "Saeed"]

from time import sleep
from random import choice, sample

if __name__ == "__main__":
    db = SupabaseTestClient()


    # attendees = []
    # for x in range(20):
    #     attendees.append(
    #         db.add_attendee(
    #             name=f"{choice(firstNames)} {choice(lastNames)}",
    #             country="pk",
    #             company="ABC",
    #             sector=choice(["Tech", "Finance", "Health", "Energy", "Other"]),
    #             title="Programmer",
    #             linkedin_url=f"https://linkedin.com/in/{firstNames[x].lower()}-test",
    #         )
    #      )
        
    # exit(0)

    attendees = db.list_attendees()
    for _ in range(15):

        if len(attendees) < 2:
            break

        scanner, scanned = sample(attendees, 2)

        try:
            connection = db.add_connection(
                scanner_id=scanner["id"],
                scanned_id=scanned["id"],
            )

            print(
                f"Added connection: "
                f"{scanner['name']} -> {scanned['name']}"
            )

        except Exception as e:
            print(
                f"Skipped duplicate: "
                f"{scanner['name']} -> {scanned['name']} | {e}"
            )

        sleep(1)


        # attendees.append(
        #     db.add_attendee(
        #         name=f"{choice(firstNames)} {choice(lastNames)}",
        #         country="pk",
        #         company="ABC",
        #         sector="Tech",
        #         title="Programmer",
        #         linkedin_url=f"https://linkedin.com/in/{firstNames[x].lower()}-test",
        #     )
        # )

    # hassan = db.add_attendee(
    #     name="Hassan Abbas",
    #     country="pk",
    #     company="ABC",
    #     sector="Tech",
    #     title="Programmer",
    #     linkedin_url="https://linkedin.com/in/hassan-test",
    # )

    # sara = db.add_attendee(
    #     name="Sara Khan",
    #     country="ae",
    #     company="Example Capital",
    #     sector="Finance",
    #     title="Partner",
    #     linkedin_url="https://linkedin.com/in/sara-test",
    # )

    # connection = db.add_connection(
    #     from_attendee_id=hassan["id"],
    #     to_attendee_id=sara["id"],
    # )

    # print("Added attendees:")
    # print(hassan)
    # print(sara)

    # print("\nConnection:")
    # print(connection)

    # print("\nAll attendees:")
    # print(db.list_attendees())

    # print("\nAll connections:")
    # print(db.list_connections())