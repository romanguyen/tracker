-- Seed: official B-PVA state-exam topics (template 2025/2026 or earlier).
-- Source: https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs
-- Repeatable: rerunning updates catalogue rows without touching user data.
-- Note: "Softwarové inženýrství" (systems question 12) is excluded for this
-- curriculum; "Paralelní systémy" keeps official number 13.

insert into public.topics (
  id,
  section,
  official_number,
  display_order,
  title_cs,
  description_cs,
  course_links,
  source_url,
  curriculum_version
)
values
  (
    'theory-01', 'theory', 1, 1,
    'Lineární algebra',
    'Operace s vektory a maticemi, Gaussova eliminace, inverzní matice, determinant. Vlastnosti lineárních operací a skalárního součinu, vektorové podprostory, vektorové báze. Lineární transformace, matice zobrazení, vlastní čísla a vektory a jejich geometrický význam.',
    '[{"code": "MB141", "url": "https://is.muni.cz/auth/el/fi/jaro2026/MB141/um/"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  ),
  (
    'theory-02', 'theory', 2, 2,
    'Základy matematické analýzy',
    'Relace a zobrazení, vlastnosti reálných funkcí, polynomy, spojité funkce a limity, derivace, neurčitý a určitý integrál, geometrický význam.',
    '[{"code": "IB000", "url": "https://is.muni.cz/auth/el/fi/podzim2025/IB000/um/MZI-text25.pdf"}, {"code": "MB142", "url": "https://is.muni.cz/auth/el/fi/podzim2025/MB142/um/"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  ),
  (
    'theory-03', 'theory', 3, 3,
    'Popisná statistika',
    'Popisná statistika, střední hodnota, medián, rozptyl, korelace. Odhady statistik a jejich spolehlivost. Distribuční funkce, rozdělení náhodných veličin a jejich příklady.',
    '[{"code": "MB143", "url": "https://is.muni.cz/auth/el/fi/jaro2026/MB143/um/"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  ),
  (
    'theory-04', 'theory', 4, 4,
    'Grafy a jejich prohledávání',
    'Typy grafů, stromy, stupně vrcholů, orientované grafy, reprezentace grafů. Algoritmy prohledávání grafu do hloubky a do šířky a jejich využití. Komponenty souvislosti.',
    '[{"code": "IB000", "url": "https://is.muni.cz/auth/el/fi/podzim2025/IB000/um/MZI-text25.pdf"}, {"code": "IB002", "url": "https://is.muni.cz/auth/el/fi/jaro2026/IB002/um/slajdy_ucebni_texty/"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  ),
  (
    'theory-05', 'theory', 5, 5,
    'Grafové algoritmy',
    'Ohodnocené grafy, definice nejkratší cesty, minimální kostry grafu, algoritmy pro hledání nejkratších cest (Dijkstrův, Bellman-Fordův algoritmus) a minimálních koster v grafu.',
    '[{"code": "IB000", "url": "https://is.muni.cz/auth/el/fi/podzim2025/IB000/um/MZI-text25.pdf"}, {"code": "IB002", "url": "https://is.muni.cz/auth/el/fi/jaro2026/IB002/um/slajdy_ucebni_texty/"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  ),
  (
    'theory-06', 'theory', 6, 6,
    'Stromové datové struktury',
    'Binární vyhledávací stromy, B-stromy, červeno-černé stromy, haldy, související operace a jejich složitost. Typické implementace, příklady použití.',
    '[{"code": "IB002", "url": "https://is.muni.cz/auth/el/fi/jaro2026/IB002/um/slajdy_ucebni_texty/"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  ),
  (
    'theory-07', 'theory', 7, 7,
    'Návrh algoritmů',
    'Metoda rozděl a panuj, výhody a nevýhody použití rekurze, odstranění rekurze. Vysvětlení principů a implementace řadících rekurzivních algoritmů. Vztah rekurze a matematické indukce.',
    '[{"code": "IB002", "url": "https://is.muni.cz/auth/el/fi/jaro2026/IB002/um/slajdy_ucebni_texty/"}, {"code": "IB015", "url": "https://is.muni.cz/auth/el/fi/podzim2025/IB015/index.qwarp"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  ),
  (
    'theory-08', 'theory', 8, 8,
    'Funkcionální programování',
    'Funkcionální programovací paradigma (princip výpočtu, redukční krok, redukční strategie a jejich vlastnosti, příklady). Funkce vyšších řádů a jejich využití. Nepojmenované funkce. Schopnost elementárního programování v Haskellu.',
    '[{"code": "IB015", "url": "https://is.muni.cz/auth/el/fi/podzim2025/IB015/index.qwarp"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  ),
  (
    'theory-09', 'theory', 9, 9,
    'Regulární jazyky',
    'Chomského hierarchie formálních jazyků. Regulární jazyky, jejich reprezentace a převody mezi nimi. Varianty konečných automatů. Nedeterminismus a determinizace automatů. Uzávěrové vlastnosti regulárních jazyků.',
    '[{"code": "IB110", "url": "https://is.muni.cz/auth/el/fi/jaro2026/IB110/index.qwarp"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  ),
  (
    'theory-10', 'theory', 10, 10,
    'Rozhodnutelnost',
    'Pojem algoritmického problému a algoritmu. Turingův stroj a problém zastavení. Rozhodnutelnost a částečná rozhodnutelnost, nerozhodnutelnost. Metoda redukce.',
    '[{"code": "IB110", "url": "https://is.muni.cz/auth/el/fi/jaro2026/IB110/index.qwarp"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  ),
  (
    'theory-11', 'theory', 11, 11,
    'Složitost',
    'Časová složitost algoritmu versus časová složitost problému. Složitostní třídy (P, NP) a vztahy mezi nimi, příklady problémů z jednotlivých tříd. Těžkost a úplnost problému v dané třídě, polynomiální redukce problémů, NP-úplné úlohy.',
    '[{"code": "IB110", "url": "https://is.muni.cz/auth/el/fi/jaro2026/IB110/index.qwarp"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  ),
  (
    'systems-01', 'systems', 1, 1,
    'Podprogramy a objektově orientované programování',
    'Podprogramy, rozsahy jmen, předávání hodnot, výjimky. Objektově orientované programování. Zapouzdření, dědičnost, polymorfismus - principy, použití a implementace. Realizace v jazycích C#, C++ nebo Java (dle vlastní volby).',
    '[{"code": "PB006", "url": "https://is.muni.cz/auth/el/fi/podzim2025/PB006/um/"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  ),
  (
    'systems-02', 'systems', 2, 2,
    'Principy nízkoúrovňového programování',
    'Paměťový model programu; správa paměti, nízkoúrovňová práce s pamětí, ukazatel, pole a ukazatelová aritmetika, práce s uživatelskými datovými strukturami. Realizace v programovacím jazyku dle vlastní volby.',
    '[{"code": "PB111", "url": "https://is.muni.cz/auth/el/fi/jaro2026/PB111/um/"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  ),
  (
    'systems-03', 'systems', 3, 3,
    'Nízkoúrovňové výpočetní architektury',
    'Číselné soustavy, vztahy mezi soustavami, zobrazení celého čísla v počítači, aritmetika. Kódy, vnitřní, vnější, detekční a opravné. Obvody a paměti: parametry, architektura. Procesor, programování, mikroprogramování. Architektury: RISC/CISC, vyrovnávací paměti.',
    '[{"code": "PB151", "url": "https://www.fi.muni.cz/usr/brandejs/AP/"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  ),
  (
    'systems-04', 'systems', 4, 4,
    'Databáze',
    'Relační model dat, relační schéma, klíče relačních schémat, relační algebra (projekce, selekce, agregace, přejmenování), spojování relací. Funkční závislosti, normální formy (1NF, 2NF, 3NF, Boyce-Coddova NF), vztahy mezi normálními formami. Dekompozice relačních schémat, normalizace schématu.',
    '[{"code": "PB154", "url": "https://is.muni.cz/auth/el/fi/podzim2025/PB154/um/"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  ),
  (
    'systems-05', 'systems', 5, 5,
    'SQL, transakce a zpracování dotazů',
    'Syntaxe a sémantika příkazů. Příkazy pro dotazování a aktualizaci dat, agregační funkce, triggery a uložené procedury, definici dat, integritní omezení. Transakční zpracování, jeho vlastnosti. Základní principy vyhodnocování dotazů (náklady na vyhodnocení dotazu, využití indexování a hašování).',
    '[{"code": "PB154", "url": "https://is.muni.cz/auth/el/fi/podzim2025/PB154/um/"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  ),
  (
    'systems-06', 'systems', 6, 6,
    'Operační systémy',
    'Architektura operačního systému, architektura jádra, základní režimy procesoru. Programovací rozhraní, knihovny. Uživatel, přístupová práva, virtualizace. Virtuální paměť, proces a stránkové tabulky. Vlákno, plánování vláken a procesů. Souběžnost, uváznutí, přidělování zdrojů. Vznik procesu a spuštění programu v systémech POSIX, copy-on-write.',
    '[{"code": "PB152", "url": "https://is.muni.cz/auth/el/fi/jaro2026/PB152/um/"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  ),
  (
    'systems-07', 'systems', 7, 7,
    'Souborové systémy',
    'Blokové zařízení, bloková vrstva, I/O plánovač, RAID, šifrování disku. Obyčejné soubory, alokace volného místa, fragmentace. Adresářová struktura a její reprezentace na disku. Vstup a výstup mapovaný do paměti.',
    '[{"code": "PB152", "url": "https://is.muni.cz/auth/el/fi/jaro2026/PB152/um/"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  ),
  (
    'systems-08', 'systems', 8, 8,
    'Sítě',
    'Modely vrstev počítačových sítí (ISO/OSI, TCP/IP): funkcionalita a součinnost vrstev, adresace. Fyzická vrstva, signály a jejich kódování, řízení přístupu k médiu. Propojování počítačových sítí. Síťové protokoly, přepínání a směrování, multicast. Zajištěný přenos dat, sestavení a ukončení spojení. Transportní protokoly.',
    '[{"code": "PB156", "url": "https://is.muni.cz/auth/el/fi/jaro2026/PB156/um/"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  ),
  (
    'systems-09', 'systems', 9, 9,
    'Síťové aplikace a jejich bezpečnost',
    'Základní aplikační protokoly: doručování pošty, přenos souborů, web, jmenná služba. Principy popisu a zajištění kvality služby, použití pro multimédia. Zabezpečení síťové komunikace, autentizace a šifrování, zabezpečení na jednotlivých protokolových vrstvách.',
    '[{"code": "PB156", "url": "https://is.muni.cz/auth/el/fi/jaro2026/PB156/um/"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  ),
  (
    'systems-10', 'systems', 10, 10,
    'Základy informační bezpečnosti',
    'Základní bezpečnostní funkce a jejich zajištění – důvěrnost, integrita, dostupnost, nepopiratelnost původu. Kryptografická primitiva, protokoly. Řízení rizik, audit, bezpečnostní operace, standardy, hodnocení bezpečnosti.',
    '[{"code": "PV080", "url": "https://is.muni.cz/auth/el/fi/jaro2026/PV080/um/"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  ),
  (
    'systems-11', 'systems', 11, 11,
    'Vývoj bezpečných aplikací',
    'Řízení identity a přístupu. Ochrana soukromí – koncepty a metody. Bezpečné programování, statické a dynamické nástroje pro analýzu bezpečnosti software. Použitelná bezpečnost.',
    '[{"code": "PV080", "url": "https://is.muni.cz/auth/el/fi/jaro2026/PV080/um/"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  ),
  (
    'systems-13', 'systems', 13, 12,
    'Paralelní systémy',
    'Základní metody v návrhu paralelních algoritmů - dekompozice, mapování, komunikační primitiva. Výkonnostní analýza paralelních algoritmů. Paralelní algoritmy v prostředí se sdílenou pamětí. OpenMP standard. POSIX Threads. Lock-free přístup. Paralelní algoritmy v prostředí s distribuovanou pamětí. Message Passing Interface (MPI).',
    '[{"code": "IB109", "url": "https://is.muni.cz/auth/el/fi/jaro2026/IB109/index.qwarp"}]'::jsonb,
    'https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs',
    'bc-pva-2025/2026-or-earlier'
  )
on conflict (id) do update set
  section = excluded.section,
  official_number = excluded.official_number,
  display_order = excluded.display_order,
  title_cs = excluded.title_cs,
  description_cs = excluded.description_cs,
  course_links = excluded.course_links,
  source_url = excluded.source_url,
  curriculum_version = excluded.curriculum_version;
