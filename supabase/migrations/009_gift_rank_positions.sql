-- Gifts: min_value = leaderboard position (1 = 1st). Remap old mason bag thresholds.

UPDATE categories
SET category_rewards = '[
  {"id":"tv","min_value":1,"name_english":"TV Gift","name_telugu":"టీవీ బహుమతి","description_english":"1st place — after target","description_telugu":"① స్థానం — లక్ష్యం తర్వాత","image_src":"/gifts/mason-tv.svg"},
  {"id":"grinder","min_value":2,"name_english":"Mixer Grinder","name_telugu":"మిక్సీ గ్రైండర్","description_english":"2nd place — after target","description_telugu":"② స్థానం — లక్ష్యం తర్వాత","image_src":"/gifts/mason-grinder.svg"},
  {"id":"iron-box","min_value":3,"name_english":"Iron Box","name_telugu":"ఇనుము బాక్స్","description_english":"3rd place — after target","description_telugu":"③ స్థానం — లక్ష్యం తర్వాత","image_src":"/gifts/mason-iron-box.svg"},
  {"id":"design-kit","min_value":4,"name_english":"Design Kit","name_telugu":"డిజైన్ కిట్","description_english":"4th place — after target","description_telugu":"④ స్థానం — లక్ష్యం తర్వాత","image_src":"/gifts/mason-design-kit.svg"}
]'::jsonb
WHERE name_english ILIKE '%mason%'
  AND category_rewards::text LIKE '%600%';
