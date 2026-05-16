export const defaultTags = [
  'Vegetarian', 'Vegan', 'High Protein', 'Low Carb',
  'Dairy Free', 'Gluten Free', 'Quick', 'Meal Prep', 'Budget Friendly',
];

export const seedTagsSql = defaultTags
  .map(name => `INSERT OR IGNORE INTO tags (name, is_default) VALUES ('${name}', 1);`)
  .join('\n');

export default `
    CREATE TABLE IF NOT EXISTS recipes (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        title       TEXT    NOT NULL,
        description TEXT,
        effort      TEXT    CHECK(effort IN ('easy', 'medium', 'hard')),
        prep_time   INTEGER,
        cook_time   INTEGER,
        servings    INTEGER,
        image_uri   TEXT,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id  INTEGER NOT NULL,
        name       TEXT    NOT NULL,
        quantity   TEXT    NOT NULL,
        unit       TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recipe_steps (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id   INTEGER NOT NULL,
        instruction TEXT    NOT NULL,
        sort_order  INTEGER NOT NULL,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT    NOT NULL UNIQUE,
        is_default INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS recipe_tags (
        recipe_id  INTEGER NOT NULL,
        tag_id     INTEGER NOT NULL,
        PRIMARY KEY (recipe_id, tag_id),
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id)    REFERENCES tags(id)    ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_ingredients_recipe_id ON recipe_ingredients(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_steps_recipe_id ON recipe_steps(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe_id ON recipe_tags(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag_id ON recipe_tags(tag_id);

    ${seedTagsSql}
`;
