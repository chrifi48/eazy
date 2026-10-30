-- eazy — seed data (run after migrations)

insert into public.project_types (slug, name_fr, name_ar, name_en, description_fr, description_ar, description_en, icon, sort_order) values
('website','Site web','موقع إلكتروني','Website','Site vitrine, e-commerce ou plateforme web','موقع تعريفي أو متجر إلكتروني أو منصة ويب','Showcase, e-commerce or web platform','Globe',1),
('mobile','Application mobile','تطبيق موبايل','Mobile App','Application iOS et Android','تطبيق iOS و Android','iOS and Android application','Smartphone',2),
('desktop','Application bureau','تطبيق سطح المكتب','Desktop App','Logiciel Windows / macOS','برنامج لنظامي Windows و macOS','Windows / macOS software','Monitor',3);

insert into public.categories (slug, name_fr, name_ar, name_en, description_fr, description_en, icon, sort_order) values
('showcase','Site vitrine','موقع تعريفي','Showcase Website','Présentez votre activité en ligne','Present your business online','Layout',1),
('ecommerce','E-commerce','تجارة إلكترونية','E-commerce','Vendez vos produits en ligne','Sell your products online','ShoppingCart',2),
('stock','Gestion de stock','إدارة المخزون','Stock Management','Suivez produits, entrées et sorties','Track products, inbound and outbound','Package',3),
('booking','Réservation / Rendez-vous','حجز ومواعيد','Booking / Reservation','Gérez réservations et agenda','Manage bookings and calendar','CalendarCheck',4),
('restaurant','Restaurant','مطعم','Restaurant','Menu, commandes et réservations de tables','Menu, orders and table reservations','UtensilsCrossed',5),
('school','Gestion scolaire','إدارة المدارس','School Management','Élèves, notes, emplois du temps','Students, grades, timetables','GraduationCap',6);

-- all categories on website; stock/booking/school also on mobile+desktop; ecommerce/restaurant also mobile
insert into public.category_project_types (category_id, project_type_id)
select c.id, p.id from public.categories c join public.project_types p on
  p.slug = 'website'
  or (p.slug = 'mobile'  and c.slug in ('ecommerce','stock','booking','restaurant','school'))
  or (p.slug = 'desktop' and c.slug in ('stock','booking','school'));

-- templates: 2 per category
insert into public.templates (slug, category_id, name_fr, name_en, short_desc_fr, short_desc_en, price_min, price_max, delivery_days, technologies, is_featured, sort_order, included_features)
select v.slug, c.id, v.name_fr, v.name_en, v.sd_fr, v.sd_en, v.pmin, v.pmax, v.days, v.tech, v.feat, v.ord, v.inc
from (values
 ('showcase','vitrine-corporate','Corporate','Corporate','Site professionnel sobre et rapide','Clean, fast professional site',3000,6000,10,array['Next.js','Tailwind'],true,1,array['Pages À propos / Services / Contact','Formulaire de contact','SEO de base']),
 ('showcase','vitrine-portfolio','Portfolio Créatif','Creative Portfolio','Mettez vos réalisations en valeur','Showcase your work',2500,5000,8,array['Next.js','Framer Motion'],false,2,array['Galerie projets','Page contact','Animations']),
 ('ecommerce','shop-fashion','Boutique Mode','Fashion Store','Boutique élégante pour vêtements','Elegant clothing store',8000,16000,25,array['Next.js','Supabase','Stripe'],true,1,array['Catalogue produits','Panier','Paiement en ligne','Gestion des commandes']),
 ('ecommerce','shop-multi','Marketplace','Marketplace','Plusieurs vendeurs, une plateforme','Multiple vendors, one platform',15000,30000,45,array['Next.js','Supabase'],false,2,array['Comptes vendeurs','Commissions','Catalogue','Paiement']),
 ('stock','stock-simple','Stock Simple','Simple Stock','Produits, entrées/sorties, alertes','Products, in/out, alerts',6000,12000,20,array['Next.js','Supabase'],true,1,array['Gestion produits','Mouvements de stock','Alertes seuil','Export Excel']),
 ('stock','stock-pro','Stock Multi-dépôts','Multi-warehouse Stock','Multi-dépôts, fournisseurs, rapports','Warehouses, suppliers, reports',12000,25000,35,array['Next.js','Supabase'],false,2,array['Multi-dépôts','Fournisseurs','Bons de commande','Rapports']),
 ('booking','booking-clinic','Cabinet / Clinique','Clinic Booking','Prise de rendez-vous en ligne','Online appointment booking',5000,10000,15,array['Next.js','Supabase'],true,1,array['Calendrier','Rappels email','Fiches clients']),
 ('booking','booking-salon','Salon & Beauté','Salon & Beauty','Réservations de services et staff','Service and staff bookings',5000,11000,15,array['Next.js','Supabase'],false,2,array['Services','Staff','Calendrier','Rappels']),
 ('restaurant','resto-menu','Menu Digital','Digital Menu','Menu QR code et commandes','QR menu and orders',4000,9000,12,array['Next.js','Supabase'],true,1,array['Menu QR','Commandes','Admin menu']),
 ('restaurant','resto-full','Restaurant Complet','Full Restaurant','Menu, réservations, livraison','Menu, reservations, delivery',9000,18000,28,array['Next.js','Supabase'],false,2,array['Menu','Réservation de tables','Livraison','Paiement']),
 ('school','school-basic','École Essentiel','School Essentials','Élèves, classes, présences','Students, classes, attendance',10000,20000,30,array['Next.js','Supabase'],true,1,array['Élèves','Classes','Présences','Notes']),
 ('school','school-pro','École Complète','Full School Suite','Scolarité, paiements, portail parents','Admissions, payments, parent portal',20000,40000,60,array['Next.js','Supabase'],false,2,array['Portail parents','Paiements','Emplois du temps','Bulletins'])
) as v(cat, slug, name_fr, name_en, sd_fr, sd_en, pmin, pmax, days, tech, feat, ord, inc)
join public.categories c on c.slug = v.cat;

update public.templates set name_ar = name_fr, short_desc_en = coalesce(short_desc_en, short_desc_fr);

insert into public.template_project_types (template_id, project_type_id)
select t.id, p.id from public.templates t
join public.categories c on c.id = t.category_id
join public.project_types p on p.slug = 'website'
   or (p.slug = 'mobile'  and c.slug in ('ecommerce','stock','booking','restaurant','school'))
   or (p.slug = 'desktop' and c.slug in ('stock','booking','school'));

-- features: 15 in 4 groups
insert into public.feature_groups (name_fr, name_ar, name_en, sort_order) values
('Utilisateurs & Sécurité','المستخدمون والأمان','Users & Security',1),
('Paiements','المدفوعات','Payments',2),
('Rapports & Données','التقارير والبيانات','Reports & Data',3),
('Communication & Extras','التواصل وإضافات','Communication & Extras',4);

insert into public.features (group_id, name_fr, name_en, price_min, price_max, extra_days, sort_order)
select g.id, v.name_fr, v.name_en, v.pmin, v.pmax, v.days, v.ord
from (values
 ('Users & Security','Connexion / inscription','User login & signup',800,1500,2,1),
 ('Users & Security','Rôles et permissions','Roles & permissions',1000,2000,3,2),
 ('Users & Security','Authentification 2FA','Two-factor authentication',600,1200,2,3),
 ('Users & Security','Panneau d''administration','Admin panel',2000,4000,6,4),
 ('Payments','Paiement par carte','Card payment',1500,3000,4,1),
 ('Payments','Facturation PDF','PDF invoicing',800,1600,3,2),
 ('Payments','Abonnements récurrents','Recurring subscriptions',1500,3000,5,3),
 ('Reports & Data','Tableau de bord statistiques','Statistics dashboard',1200,2500,4,1),
 ('Reports & Data','Export Excel / PDF','Excel / PDF export',500,1000,2,2),
 ('Reports & Data','Import de données','Data import',500,1200,2,3),
 ('Communication & Extras','Notifications email','Email notifications',500,1000,2,1),
 ('Communication & Extras','Notifications SMS / WhatsApp','SMS / WhatsApp notifications',800,1600,3,2),
 ('Communication & Extras','Multilingue (FR/AR/EN)','Multi-language (FR/AR/EN)',1000,2000,4,3),
 ('Communication & Extras','Intégrations API tierces','Third-party API integrations',1500,3500,5,4),
 ('Communication & Extras','Chat en direct','Live chat',700,1400,2,5)
) as v(grp, name_fr, name_en, pmin, pmax, days, ord)
join public.feature_groups g on g.name_en = v.grp;

update public.features set name_ar = name_fr;

insert into public.packages (name_fr, name_ar, name_en, description_fr, description_en, price, is_highlighted, sort_order, items_fr, items_en) values
('Basic','أساسي','Basic','Pour démarrer','To get started',3000,false,1,
  '["Jusqu''à 5 pages","Design responsive","Formulaire de contact","1 mois de support"]','["Up to 5 pages","Responsive design","Contact form","1 month support"]'),
('Pro','احترافي','Pro','Le plus choisi','Most popular',8000,true,2,
  '["Pages illimitées","Panneau d''administration","SEO avancé","Multilingue","3 mois de support"]','["Unlimited pages","Admin panel","Advanced SEO","Multi-language","3 months support"]'),
('Premium','مميز','Premium','Solution sur mesure','Fully custom solution',18000,false,3,
  '["Design sur mesure","Fonctionnalités avancées","Intégrations API","Formation","12 mois de support"]','["Custom design","Advanced features","API integrations","Training","12 months support"]');

insert into public.packages (name_fr, name_ar, name_en, price, billing_type, kind, is_highlighted, sort_order, items_fr, items_en) values
('Maintenance Standard','صيانة عادية','Standard Maintenance',300,'monthly','maintenance',false,10,'["Mises à jour","Sauvegardes","Support email"]','["Updates","Backups","Email support"]'),
('Hébergement + Maintenance','استضافة وصيانة','Hosting + Maintenance',3000,'yearly','maintenance',true,11,'["Hébergement","Nom de domaine","Maintenance","Support prioritaire"]','["Hosting","Domain","Maintenance","Priority support"]');

-- availability: Mon–Fri 09:00–17:00, lunch break 13:00–14:00, 60-min slots
insert into public.availability (weekday, start_time, end_time, slot_minutes, break_start, break_end, max_per_day)
select d, '09:00', '17:00', 60, '13:00', '14:00', 6 from generate_series(1,5) d;

insert into public.site_settings (key, value) values
('brand', '{"name":"eazy","primary":"#1E3A8A","accent":"#F97316"}'),
('contact', '{"email":"","phone":"","whatsapp":"","address":"Rabat, Maroc","maps":"","social":{}}'),
('currency', '{"default":"MAD","eur_enabled":true,"eur_rate":0.092}'),
('maintenance_mode', 'false'),
('private_email_templates', '{}');
