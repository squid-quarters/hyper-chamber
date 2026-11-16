-- Generated using PracticeStore from released tag v1.0.0, commit c43378e634cdf64d8d932bf5d56b43cc1f7dc82d.
-- Synthetic learner entries; no user data. UUID and dates normalized after generation.
CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
INSERT INTO metadata(key,value) VALUES ('library-id','6e1b9675-e60a-4e04-8ae7-d6a93d219380');
CREATE TABLE practice_entries (
				reference_id TEXT PRIMARY KEY,
				saved INTEGER NOT NULL CHECK(saved IN (0, 1)),
				status TEXT NOT NULL CHECK(status IN ('untried', 'practising', 'reliable')),
				note TEXT NOT NULL CHECK(length(note) <= 4000),
				reference_revision INTEGER NOT NULL CHECK(reference_revision > 0),
				row_version INTEGER NOT NULL CHECK(row_version > 0),
				updated_at TEXT NOT NULL
			) STRICT;
INSERT INTO practice_entries(reference_id,saved,status,note,reference_revision,row_version,updated_at) VALUES ('dhalsim-full-early-lights-od-fire',1,'reliable','Keep this released-library note.',3,3,'2026-11-15T00:00:00.000Z');
INSERT INTO practice_entries(reference_id,saved,status,note,reference_revision,row_version,updated_at) VALUES ('temporarily-unavailable',0,'untried','Keep unavailable references too.',2,1,'2026-11-15T00:00:00.000Z');
CREATE TABLE schema_migrations (
				version INTEGER PRIMARY KEY,
				name TEXT NOT NULL,
				applied_at TEXT NOT NULL
			) STRICT;
INSERT INTO schema_migrations(version,name,applied_at) VALUES (1,'Personal practice library','2026-11-15T00:00:00.000Z');
PRAGMA application_id=1212371026;
PRAGMA user_version=1;
