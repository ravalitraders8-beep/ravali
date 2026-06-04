-- Simple local Telugu for categories & rewards (not dictionary / book Telugu)

UPDATE categories SET name_telugu = 'వడ్రంగి' WHERE name_english = 'Carpenter';
UPDATE categories SET name_telugu = 'ఎలెక్ట్రీషియన్' WHERE name_english = 'Electrician';

UPDATE reward_levels SET reward_description_telugu = 'స్వాగతం బహుమతి'
  WHERE level_name_english = 'Bronze';
UPDATE reward_levels SET reward_description_telugu = 'టూల్ కిట్'
  WHERE level_name_english = 'Silver';
UPDATE reward_levels SET reward_description_telugu = 'మొబైల్ రీచార్జ్'
  WHERE level_name_english = 'Gold';
UPDATE reward_levels SET reward_description_telugu = 'బహుమతి + ట్రోఫీ'
  WHERE level_name_english = 'Diamond';
