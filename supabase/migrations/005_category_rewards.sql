-- Per-category gift milestones (linked to target unit: bags or amount)

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS category_rewards JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Mason default gifts (bags)
UPDATE categories
SET category_rewards = '[
  {"id":"tv","min_value":600,"name_english":"TV Gift","name_telugu":"టీవీ బహుమతి","description_english":"LED TV for top mason partners","description_telugu":"అత్యుత్తమ మేస్త్రీలకు LED TV","image_src":"/gifts/mason-tv.svg"},
  {"id":"grinder","min_value":300,"name_english":"Mixer Grinder","name_telugu":"మిక్సీ గ్రైండర్","description_english":"Mixer grinder for your home","description_telugu":"మీ ఇంటికి మిక్సీ గ్రైండర్","image_src":"/gifts/mason-grinder.svg"},
  {"id":"iron-box","min_value":200,"name_english":"Iron Box","name_telugu":"ఇనుము బాక్స్","description_english":"Electric iron box","description_telugu":"ఎలక్ట్రిక్ ఇనుము బాక్స్","image_src":"/gifts/mason-iron-box.svg"},
  {"id":"design-kit","min_value":100,"name_english":"Design Kit","name_telugu":"డిజైన్ కిట్","description_english":"Mason tool & design kit","description_telugu":"మేస్త్రీ టూల్ & డిజైన్ కిట్","image_src":"/gifts/mason-design-kit.svg"}
]'::jsonb
WHERE name_english = 'Mason'
  AND (category_rewards IS NULL OR category_rewards = '[]'::jsonb);
