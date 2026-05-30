-- Remove sample/mock contractors and their transactions only.
-- Safe to run on a live database — real contractors are NOT deleted.
-- Categories and reward levels are kept (shop configuration).

DELETE FROM rewards_delivered
WHERE contractor_id IN (
  SELECT id FROM contractors
  WHERE phone LIKE '910000000%'
     OR qr_token IN (
       'CTR-PAINT-001', 'CTR-PAINT-002', 'CTR-PAINT-003',
       'CTR-ELEC-001',  'CTR-ELEC-002',  'CTR-ELEC-003',
       'CTR-PLMB-001',  'CTR-PLMB-002',  'CTR-PLMB-003',
       'CTR-MASN-001',  'CTR-MASN-002',  'CTR-MASN-003',
       'CTR-CARP-001',  'CTR-CARP-002',  'CTR-CARP-003'
     )
);

DELETE FROM admin_logs
WHERE target_contractor_id IN (
  SELECT id FROM contractors
  WHERE phone LIKE '910000000%'
     OR qr_token IN (
       'CTR-PAINT-001', 'CTR-PAINT-002', 'CTR-PAINT-003',
       'CTR-ELEC-001',  'CTR-ELEC-002',  'CTR-ELEC-003',
       'CTR-PLMB-001',  'CTR-PLMB-002',  'CTR-PLMB-003',
       'CTR-MASN-001',  'CTR-MASN-002',  'CTR-MASN-003',
       'CTR-CARP-001',  'CTR-CARP-002',  'CTR-CARP-003'
     )
);

DELETE FROM transactions
WHERE contractor_id IN (
  SELECT id FROM contractors
  WHERE phone LIKE '910000000%'
     OR qr_token IN (
       'CTR-PAINT-001', 'CTR-PAINT-002', 'CTR-PAINT-003',
       'CTR-ELEC-001',  'CTR-ELEC-002',  'CTR-ELEC-003',
       'CTR-PLMB-001',  'CTR-PLMB-002',  'CTR-PLMB-003',
       'CTR-MASN-001',  'CTR-MASN-002',  'CTR-MASN-003',
       'CTR-CARP-001',  'CTR-CARP-002',  'CTR-CARP-003'
     )
);

DELETE FROM contractors
WHERE phone LIKE '910000000%'
   OR qr_token IN (
     'CTR-PAINT-001', 'CTR-PAINT-002', 'CTR-PAINT-003',
     'CTR-ELEC-001',  'CTR-ELEC-002',  'CTR-ELEC-003',
     'CTR-PLMB-001',  'CTR-PLMB-002',  'CTR-PLMB-003',
     'CTR-MASN-001',  'CTR-MASN-002',  'CTR-MASN-003',
     'CTR-CARP-001',  'CTR-CARP-002',  'CTR-CARP-003'
   );
