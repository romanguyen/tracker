-- One-shot: pin your local study PDFs as file:// links on each topic.
-- HOW TO USE: replace 'you@example.com' below with the exact email you use
-- to sign in to the tracker (pins are per-user), then run in SQL Editor.

insert into public.topic_links (user_id, topic_id, label, url)
select u.id, x.topic_id, x.label, x.url
from auth.users u
cross join (
  values
  ('theory-01', '1. Lineární algebra', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Teoretick%C3%A9%20ot%C3%A1zky%20(2024)/1.%20Line%C3%A1rn%C3%AD%20algebra.pdf'),
  ('theory-02', '2. Základy matematické analýzy', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Teoretick%C3%A9%20ot%C3%A1zky%20(2024)/2.%20Z%C3%A1klady%20matematick%C3%A9%20anal%C3%BDzy.pdf'),
  ('theory-03', '3. Popisná statistika', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Teoretick%C3%A9%20ot%C3%A1zky%20(2024)/3.%20Popisn%C3%A1%20statistika.pdf'),
  ('theory-04', '4. Grafy a jejich prohledávání', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Teoretick%C3%A9%20ot%C3%A1zky%20(2024)/4.%20Grafy%20a%20jejich%20prohled%C3%A1v%C3%A1n%C3%AD.pdf'),
  ('theory-05', '5. Grafové algoritmy', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Teoretick%C3%A9%20ot%C3%A1zky%20(2024)/5.%20Grafov%C3%A9%20algoritmy.pdf'),
  ('theory-06', '6. Stromové datové struktury', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Teoretick%C3%A9%20ot%C3%A1zky%20(2024)/6.%20Stromov%C3%A9%20datov%C3%A9%20struktury.pdf'),
  ('theory-07', '7. Návrh algoritmů', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Teoretick%C3%A9%20ot%C3%A1zky%20(2024)/7.%20N%C3%A1vrh%20algoritm%C5%AF.pdf'),
  ('theory-08', '8. Funkcionální programování', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Teoretick%C3%A9%20ot%C3%A1zky%20(2024)/8.%20Funkcion%C3%A1ln%C3%AD%20programov%C3%A1n%C3%AD.pdf'),
  ('theory-09', '9. Regulární jazyky', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Teoretick%C3%A9%20ot%C3%A1zky%20(2024)/9.%20Regul%C3%A1rn%C3%AD%20jazyky.pdf'),
  ('theory-10', '10. Rozhodnutelnost', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Teoretick%C3%A9%20ot%C3%A1zky%20(2024)/10.%20Rozhodnutelnost.pdf'),
  ('theory-11', '11. Složitost', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Teoretick%C3%A9%20ot%C3%A1zky%20(2024)/11.%20Slo%C5%BEitost.pdf'),
  ('systems-01', '1. Strukturování a řízení běhu programu', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Praktick%C3%A9%20ot%C3%A1zky%20(2024)/1.%20Strukturov%C3%A1n%C3%AD%20a%20%C5%99%C3%ADzen%C3%AD%20b%C4%9Bhu%20programu.pdf'),
  ('systems-02', '2. Principy nízkoúrovňového programování', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Praktick%C3%A9%20ot%C3%A1zky%20(2024)/2.%20Principy%20n%C3%ADzko%C3%BArov%C5%88ov%C3%A9ho%20programov%C3%A1n%C3%AD.pdf'),
  ('systems-03', '3. Architektury', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Praktick%C3%A9%20ot%C3%A1zky%20(2024)/3.%20Architektury.pdf'),
  ('systems-04', '4. Databáze', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Praktick%C3%A9%20ot%C3%A1zky%20(2024)/4.%20Datab%C3%A1ze.pdf'),
  ('systems-05', '5. SQL', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Praktick%C3%A9%20ot%C3%A1zky%20(2024)/5.%20SQL.pdf'),
  ('systems-06', '6. Operační systémy', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Praktick%C3%A9%20ot%C3%A1zky%20(2024)/6.%20Opera%C4%8Dn%C3%AD%20syst%C3%A9my.pdf'),
  ('systems-07', '7. Souborové systémy', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Praktick%C3%A9%20ot%C3%A1zky%20(2024)/7.%20Souborov%C3%A9%20syst%C3%A9my.pdf'),
  ('systems-08', '8. Sítě', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Praktick%C3%A9%20ot%C3%A1zky%20(2024)/8.%20S%C3%ADt%C4%9B.pdf'),
  ('systems-09', '9. Síťové aplikace a bezpečnost', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Praktick%C3%A9%20ot%C3%A1zky%20(2024)/9.%20S%C3%AD%C5%A5ov%C3%A9%20aplikace%20a%20bezpe%C4%8Dnost.pdf'),
  ('systems-10', '10. Základy informační bezpečnosti', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Praktick%C3%A9%20ot%C3%A1zky%20(2024)/10.%20Z%C3%A1klady%20informa%C4%8Dn%C3%AD%20bezpe%C4%8Dnosti.pdf'),
  ('systems-11', '11. Informační bezpečnost', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Praktick%C3%A9%20ot%C3%A1zky%20(2024)/11.%20Informa%C4%8Dn%C3%AD%20bezpe%C4%8Dnost.pdf'),
  ('systems-13', '14. Paralelní systémy', 'file:///Users/duongnguyenhoang/muni/6th/St%C3%A1tnice%20PVA%20-%20Praktick%C3%A9%20ot%C3%A1zky%20(2024)/14.%20Paraleln%C3%AD%20syst%C3%A9my.pdf')
) as x(topic_id, label, url)
where u.email = 'email';
