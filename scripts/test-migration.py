from pathlib import Path
import sqlite3
import tempfile


ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "database" / "migrations" / "0001_init.sql"


def execute() -> None:
    with tempfile.TemporaryDirectory(prefix="hacktor-m0-") as directory:
        database = Path(directory) / "hacktor.sqlite3"
        connection = sqlite3.connect(database)
        connection.execute("PRAGMA foreign_keys = ON")
        connection.executescript(MIGRATION.read_text(encoding="utf-8"))

        tables = {
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type IN ('table','view')"
            )
        }
        required = {"ideation_sessions", "idea_versions", "idea_edges", "jobs", "job_outbox"}
        assert required.issubset(tables), f"Missing required tables: {required - tables}"

        connection.execute(
            "INSERT INTO users(id, email_normalized) VALUES (?, ?)",
            ("user-1", "builder@example.test"),
        )
        try:
            connection.execute(
                "INSERT INTO users(id, email_normalized) VALUES (?, ?)",
                ("user-2", "builder@example.test"),
            )
            raise AssertionError("Unique email constraint was not enforced")
        except sqlite3.IntegrityError:
            pass

        try:
            connection.execute(
                "INSERT INTO idea_versions(id, session_id, card_json, schema_version) "
                "VALUES (?, ?, ?, ?)",
                ("idea-orphan", "missing-session", "{}", "1.0"),
            )
            raise AssertionError("Foreign key constraint was not enforced")
        except sqlite3.IntegrityError:
            pass

        connection.execute(
            "INSERT INTO guest_sessions(id, capability_hash, expires_at) VALUES (?, ?, ?)",
            ("guest-1", "digest-only", "2099-01-01T00:00:00Z"),
        )
        connection.execute(
            "INSERT INTO ideation_sessions(id, guest_id, mode, title) VALUES (?, ?, ?, ?)",
            ("session-1", "guest-1", "idea_first", "Migration test"),
        )
        connection.execute(
            "INSERT INTO idea_versions(id, session_id, card_json, schema_version) "
            "VALUES (?, ?, ?, ?)",
            ("idea-1", "session-1", "{}", "1.0"),
        )
        connection.execute("DELETE FROM ideation_sessions WHERE id = ?", ("session-1",))
        remaining = connection.execute(
            "SELECT COUNT(*) FROM idea_versions WHERE id = ?", ("idea-1",)
        ).fetchone()[0]
        assert remaining == 0, "Cascade deletion did not remove idea versions"

        fts = connection.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'public_event_search'"
        ).fetchone()
        assert fts is not None, "Public FTS table was not created"
        connection.close()

    print(f"Database migration test passed with {len(tables)} schema objects.")


if __name__ == "__main__":
    execute()
