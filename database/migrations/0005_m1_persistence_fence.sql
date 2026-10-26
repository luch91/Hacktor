-- A failed ownership guard must fail the enclosing D1 batch transaction.
CREATE TABLE persistence_fence (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  valid INTEGER NOT NULL CHECK(valid = 1)
);
INSERT INTO persistence_fence (id, valid) VALUES (1, 1);
