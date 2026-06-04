-- Mason gift cards: real photo paths (hardcoded in app + DB)
UPDATE categories
SET category_rewards = '[
  {"id":"tv","min_value":1,"target_amount":600,"name_english":"TV Gift","name_telugu":"టీవీ బహుమతి","description_english":"1st place — after target","description_telugu":"① స్థానం — లక్ష్యం చేరిన తర్వాత","image_src":"/gifts/mason-tv.jpg"},
  {"id":"grinder","min_value":2,"target_amount":300,"name_english":"Mixer Grinder","name_telugu":"మిక్సీ గ్రైండర్","description_english":"2nd place — after target","description_telugu":"② స్థానం — లక్ష్యం చేరిన తర్వాత","image_src":"/gifts/mason-grinder.jpg"},
  {"id":"iron-box","min_value":3,"target_amount":200,"name_english":"Iron Box","name_telugu":"ఇనుము బాక్స్","description_english":"3rd place — after target","description_telugu":"③ స్థానం — లక్ష్యం చేరిన తర్వాత","image_src":"/gifts/mason-iron-box.jpg"},
  {"id":"design-kit","min_value":4,"target_amount":100,"name_english":"Design Kit","name_telugu":"డిజైన్ కిట్","description_english":"4th place — after target","description_telugu":"④ స్థానం — లక్ష్యం చేరిన తర్వాత","image_src":"/gifts/mason-design-kit.jpg"}
]'::jsonb
WHERE name_english ILIKE '%mason%';
