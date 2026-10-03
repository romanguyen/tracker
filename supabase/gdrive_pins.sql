-- One-shot: pin your Google Drive study docs per topic.
-- Pins 11 theory Docs (parenthesized official numbering) + 11 systems Docs.
-- The companion "Paralelní systémy" topic has no Drive doc in these folders,
-- and files without parenthesized numbers aren't part of the current exam
-- catalogue, so they are intentionally not pinned.

insert into public.topic_links (user_id, topic_id, label, url)
select u.id, x.topic_id, x.label, x.url
from auth.users u
cross join (
  values
  ('theory-01', 'Drive: (1) Lineární algebra', 'https://docs.google.com/document/d/1mNz8xIO2J26Bj4HdCLS2--xKaeJtg280XIiDmsiV9K8/edit'),
  ('theory-02', 'Drive: (2) Základy matematické analýzy', 'https://docs.google.com/document/d/1qNBUe5Si0gyKQYwgkzD1W_kY_zte68em1KJWTsM-X6A/edit'),
  ('theory-03', 'Drive: (3) Popisná statistika', 'https://docs.google.com/document/d/112E4MX0Ip28fn0pmKuALS2xeHIOArET0sDYFfg1x-5M/edit'),
  ('theory-04', 'Drive: (4) Grafy a jejich prohledávání', 'https://docs.google.com/document/d/1Sb6xUvp_3dRFU8Ht7HeQis2nfCSCZiOQ9LmTQaaseQs/edit'),
  ('theory-05', 'Drive: (5) Grafové algoritmy', 'https://docs.google.com/document/d/1r5ZEUDAgDCcZaiu-cEfZ3EIUMezZKGwripHb_dve-OU/edit'),
  ('theory-06', 'Drive: (6) Stromové datové struktury', 'https://docs.google.com/document/d/1e2C4r_yT-FjJf91s78-xTg1Ke_fi_eXZyvsD2PW7WVE/edit'),
  ('theory-07', 'Drive: (7) Návrh algoritmů', 'https://docs.google.com/document/d/1p2WqvXTVKIrtNNmn2yozQ-ezsbI-DnWEot9OckQSvvc/edit'),
  ('theory-08', 'Drive: (8) Funkcionální programování', 'https://docs.google.com/document/d/1Qp1ZTXSDMtGsd2_g8QbJ1I6Wb8r0mPc_azhDmkdizVg/edit'),
  ('theory-09', 'Drive: (9) Regulární jazyky', 'https://docs.google.com/document/d/1U-0dPemmeQfz-EiMxHBadFCH7Fm1myrVyhGk_9DYHVw/edit'),
  ('theory-10', 'Drive: (10) Rozhodnutelnost', 'https://docs.google.com/document/d/1kRG4PglQ4mqtrcdL_w1zuS8h8Qlr9Rr9xilVWwNMtOU/edit'),
  ('theory-11', 'Drive: (11) Složitost', 'https://docs.google.com/document/d/1reQ43vMUgFxap1HY_6QJ9ssyyxEB7pfC-uRU87U82P8/edit'),
  ('systems-01', 'Drive: 1. Strukturování a řízení běhu programu', 'https://docs.google.com/document/d/1aoVPt9iYIHoFD0h1shrKc9FKSR40gcFP5ji-yRIVkVA/edit'),
  ('systems-02', 'Drive: 2. Principy nízkoúrovňového programování', 'https://docs.google.com/document/d/1SAbksmF9N0VbMUbADRHbftw7up322IbJIDuyjZi-pRc/edit'),
  ('systems-03', 'Drive: 3. Architektury', 'https://docs.google.com/document/d/1TxaP8Ak4c9Z8VWCjNcx-GFGwiKsQbSxfO9mSZ7KTWx4/edit'),
  ('systems-04', 'Drive: 4. Databáze', 'https://docs.google.com/document/d/1qJBJxoV2iD9bDV3QzwHbt0xmUVI7RuZHWwTzpXfZdrw/edit'),
  ('systems-05', 'Drive: 5. SQL', 'https://docs.google.com/document/d/1GhiJb-arilpMspLPl71ZZxexhvYKqpSATzGgOtnZ-20/edit'),
  ('systems-06', 'Drive: 6. Operační systémy', 'https://docs.google.com/document/d/1bl1t2LgsqYDhj0JZnAJV6U-N_BLlXaykdfDS8D65XPA/edit'),
  ('systems-07', 'Drive: 7. Souborové systémy', 'https://docs.google.com/document/d/1Dyfofe3-iwbxPJvmzQnx2YlSlhGF0mxHHAUvj89ALtU/edit'),
  ('systems-08', 'Drive: 8. Sítě', 'https://docs.google.com/document/d/1y3tfKIbPt-ssm1RcbHVrTkWQ2bw8GV_tJHJ7IE1hl1U/edit'),
  ('systems-09', 'Drive: 9. Síťové aplikace a bezpečnost', 'https://docs.google.com/document/d/1HL-x1EVKxXVpc6DKq1OcNwOHDWsGTEQlB9ZU9lJIqTw/edit'),
  ('systems-10', 'Drive: 10. Základy informační bezpečnosti', 'https://docs.google.com/document/d/1LYHYHiLoKr1J4WjuyLj_YywGXyWYK7oQDnJ6A2qnN4U/edit'),
  ('systems-11', 'Drive: 11. Informační bezpečnost', 'https://docs.google.com/document/d/1jXja5uxkygcnglj9TTwO-B3arOYbKQCexBMnwe5r4ok/edit')
) as x(topic_id, label, url)
where u.email = 'email';
