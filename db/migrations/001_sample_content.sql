-- Sample content so the site looks complete while you test.
-- Everything here is editable or deletable in the admin. Replace it with real content before going live.

-- ---- thumbnails + screenshots for the 12 demo models
update templates set thumbnail_url = '/samples/' || slug || '.svg';

insert into template_images (template_id, image_url, device, sort_order)
select t.id, '/samples/' || t.slug || v.suffix || '.svg', v.device, v.ord
from templates t
cross join (values ('-1', 'desktop', 0), ('-2', 'desktop', 1), ('-m', 'mobile', 2)) as v(suffix, device, ord)
where not exists (select 1 from template_images i where i.template_id = t.id);

-- ---- long descriptions (per category)
update templates t set
  long_desc_fr = d.fr, long_desc_en = d.en, long_desc_ar = d.ar
from categories c
join (values
 ('showcase',   E'Un site professionnel clair et rapide pour présenter votre activité, vos services et vos coordonnées.\n\nIdéal pour gagner la confiance de vos clients et apparaître sur Google.',
                E'A clear, fast professional site to present your business, services and contact details.\n\nPerfect to build trust with customers and show up on Google.',
                E'موقع احترافي واضح وسريع لعرض نشاطك وخدماتك ومعلومات الاتصال.\n\nمثالي لكسب ثقة العملاء والظهور في جوجل.'),
 ('ecommerce',  E'Une boutique en ligne complète : catalogue, panier, paiement et suivi des commandes.\n\nVous gérez vos produits et vos ventes depuis un panneau d''administration simple.',
                E'A complete online store: catalogue, cart, payment and order tracking.\n\nManage your products and sales from a simple admin panel.',
                E'متجر إلكتروني متكامل: كتالوج وسلة مشتريات ودفع وتتبع الطلبات.\n\nأدر منتجاتك ومبيعاتك من لوحة تحكم بسيطة.'),
 ('stock',      E'Suivez vos produits, vos entrées et sorties, et soyez alerté avant la rupture de stock.\n\nExportez vos données en Excel et gardez le contrôle sur votre activité.',
                E'Track your products, stock movements and get alerted before you run out.\n\nExport your data to Excel and stay in control of your business.',
                E'تابع منتجاتك وحركة المخزون وتلقَّ تنبيهاً قبل نفاد الكمية.\n\nصدّر بياناتك إلى إكسل وحافظ على سيطرتك على نشاطك.'),
 ('booking',    E'Vos clients réservent en ligne, vous gérez votre agenda et vos rappels automatiquement.\n\nMoins d''appels, moins d''oublis, plus de rendez-vous honorés.',
                E'Customers book online while you manage your calendar and reminders automatically.\n\nFewer calls, fewer no-shows, more appointments kept.',
                E'يحجز عملاؤك عبر الإنترنت وتدير أنت جدولك والتذكيرات تلقائياً.\n\nمكالمات أقل ونسيان أقل ومواعيد أكثر التزاماً.'),
 ('restaurant', E'Menu en ligne, commandes et réservations de tables, accessibles par QR code.\n\nMettez à jour vos plats et vos prix en quelques secondes.',
                E'Online menu, orders and table reservations, reachable by QR code.\n\nUpdate your dishes and prices in seconds.',
                E'قائمة طعام إلكترونية وطلبات وحجز طاولات عبر رمز QR.\n\nحدّث أطباقك وأسعارك في ثوانٍ.'),
 ('school',     E'Gérez élèves, classes, présences, notes et communication avec les parents.\n\nUne solution simple pour digitaliser votre établissement.',
                E'Manage students, classes, attendance, grades and parent communication.\n\nA simple way to digitise your school.',
                E'أدر التلاميذ والأقسام والحضور والنقط والتواصل مع الأولياء.\n\nحل بسيط لرقمنة مؤسستك.')
) as d(cat, fr, en, ar) on d.cat = c.slug
where t.category_id = c.id;

update templates set short_desc_ar = name_fr where coalesce(short_desc_ar, '') = '';

-- ---- FAQ
insert into faqs (question_fr, question_en, question_ar, answer_fr, answer_en, answer_ar, sort_order)
select * from (values
 ('Le prix affiché est-il définitif ?', 'Is the displayed price final?', 'هل السعر المعروض نهائي؟',
  'Non, c''est une estimation basée sur le modèle et les fonctionnalités choisis. Le prix final est confirmé après notre rendez-vous, une fois vos besoins précisés.',
  'No, it is an estimate based on the model and features you selected. The final price is confirmed after our meeting, once your needs are clear.',
  'لا، إنه تقدير مبني على النموذج والميزات التي اخترتها. يتم تأكيد السعر النهائي بعد اجتماعنا وتحديد احتياجاتك.', 1),
 ('Combien de temps faut-il pour livrer un projet ?', 'How long does a project take?', 'كم تستغرق مدة إنجاز المشروع؟',
  'Entre 1 et 8 semaines selon le modèle et les fonctionnalités. Le délai estimé est affiché à chaque étape de la configuration.',
  'Between 1 and 8 weeks depending on the model and features. The estimated delay is shown at every step of the configurator.',
  'بين أسبوع و8 أسابيع حسب النموذج والميزات. تظهر المدة المقدرة في كل خطوة من خطوات التهيئة.', 2),
 ('Comment se passe le paiement ?', 'How does payment work?', 'كيف يتم الدفع؟',
  'Un acompte est demandé au lancement du projet, le solde est réglé à la livraison. Les modalités exactes figurent dans le devis.',
  'A deposit is requested when the project starts and the balance is paid on delivery. Exact terms are in the quote.',
  'يُطلب عربون عند انطلاق المشروع ويُدفع الباقي عند التسليم. تفاصيل الدفع موجودة في عرض السعر.', 3),
 ('Puis-je modifier le modèle choisi ?', 'Can I customise the chosen model?', 'هل يمكنني تعديل النموذج المختار؟',
  'Oui. Les modèles sont une base : couleurs, logo, textes et fonctionnalités sont adaptés à votre activité. Vous pouvez aussi demander un design sur mesure.',
  'Yes. Models are a starting point: colours, logo, texts and features are adapted to your business. You can also ask for a fully custom design.',
  'نعم. النماذج مجرد أساس: الألوان والشعار والنصوص والميزات تُكيَّف مع نشاطك. ويمكنك أيضاً طلب تصميم خاص.', 4),
 ('Proposez-vous la maintenance et l''hébergement ?', 'Do you offer maintenance and hosting?', 'هل تقدمون الصيانة والاستضافة؟',
  'Oui, des formules mensuelles ou annuelles incluent hébergement, nom de domaine, sauvegardes, mises à jour et support.',
  'Yes, monthly or yearly plans include hosting, domain name, backups, updates and support.',
  'نعم، تتضمن الباقات الشهرية أو السنوية الاستضافة واسم النطاق والنسخ الاحتياطي والتحديثات والدعم.', 5),
 ('Le site sera-t-il disponible en arabe et en français ?', 'Will the site be available in Arabic and French?', 'هل سيكون الموقع متاحاً بالعربية والفرنسية؟',
  'Oui, l''option multilingue (français, arabe avec affichage de droite à gauche, anglais) fait partie des fonctionnalités disponibles.',
  'Yes, the multi-language option (French, right-to-left Arabic, English) is one of the available features.',
  'نعم، خيار تعدد اللغات (الفرنسية والعربية بالكتابة من اليمين إلى اليسار والإنجليزية) من الميزات المتاحة.', 6)
) as v(q_fr, q_en, q_ar, a_fr, a_en, a_ar, ord)
where not exists (select 1 from faqs);

-- ---- testimonials (clearly marked examples: replace with real client feedback)
insert into testimonials (client_name, business, text_fr, text_en, text_ar, rating, sort_order)
select * from (values
 ('Exemple — Boutique Atlas', 'Entreprise fictive',
  'Le configurateur m''a permis de comprendre le prix avant même le premier rendez-vous. Projet livré dans les délais.',
  'The configurator let me understand the price before the first meeting. Project delivered on time.',
  'سمح لي المُهيِّئ بفهم السعر قبل الاجتماع الأول. تم تسليم المشروع في الوقت المحدد.', 5, 1),
 ('Exemple — Clinique Ocean', 'Entreprise fictive',
  'Nos patients réservent en ligne et les rappels automatiques ont réduit les rendez-vous manqués.',
  'Our patients book online and automatic reminders reduced no-shows.',
  'مرضانا يحجزون عبر الإنترنت والتذكيرات التلقائية قللت المواعيد الفائتة.', 5, 2),
 ('Exemple — École Horizon', 'Entreprise fictive',
  'Une solution simple pour gérer nos élèves et communiquer avec les parents. Support très réactif.',
  'A simple solution to manage our students and talk to parents. Very responsive support.',
  'حل بسيط لإدارة التلاميذ والتواصل مع الأولياء. دعم سريع الاستجابة.', 4, 3)
) as v(n, b, fr, en, ar, r, o)
where not exists (select 1 from testimonials);

-- ---- portfolio (examples)
insert into portfolio_projects (slug, title_fr, title_en, title_ar, client_name, category_id, description_fr, description_en, description_ar, result_fr, result_en, result_ar, images, technologies, is_featured, is_published, sort_order)
select v.slug, v.t_fr, v.t_en, v.t_ar, v.client, c.id, v.d_fr, v.d_en, v.d_ar, v.r_fr, v.r_en, v.r_ar, v.imgs, v.tech, true, true, v.ord
from (values
 ('exemple-boutique', 'ecommerce', 'Exemple — Boutique en ligne', 'Example — Online store', 'مثال — متجر إلكتروني', 'Client fictif',
  E'Boutique en ligne avec catalogue, panier et paiement sécurisé.', E'Online store with catalogue, cart and secure payment.', E'متجر إلكتروني مع كتالوج وسلة ودفع آمن.',
  'Commandes en ligne dès la première semaine.', 'Online orders from the first week.', 'طلبات عبر الإنترنت منذ الأسبوع الأول.', array['/samples/portfolio-1.svg'], array['Next.js','Stripe'], 1),
 ('exemple-stock', 'stock', 'Exemple — Gestion de stock', 'Example — Stock management', 'مثال — إدارة المخزون', 'Client fictif',
  E'Suivi des produits, mouvements de stock et alertes de rupture.', E'Product tracking, stock movements and low-stock alerts.', E'تتبع المنتجات وحركة المخزون وتنبيهات النفاد.',
  'Inventaire fiable et gain de temps au quotidien.', 'Reliable inventory and daily time savings.', 'جرد موثوق وتوفير للوقت يومياً.', array['/samples/portfolio-2.svg'], array['Next.js','PostgreSQL'], 2),
 ('exemple-rdv', 'booking', 'Exemple — Prise de rendez-vous', 'Example — Appointment booking', 'مثال — حجز المواعيد', 'Client fictif',
  E'Agenda en ligne avec créneaux, confirmations et rappels automatiques.', E'Online calendar with slots, confirmations and automatic reminders.', E'جدول إلكتروني مع مواعيد وتأكيدات وتذكيرات تلقائية.',
  'Moins de rendez-vous manqués.', 'Fewer missed appointments.', 'مواعيد فائتة أقل.', array['/samples/portfolio-3.svg'], array['Next.js','Email'], 3)
) as v(slug, cat, t_fr, t_en, t_ar, client, d_fr, d_en, d_ar, r_fr, r_en, r_ar, imgs, tech, ord)
join categories c on c.slug = v.cat
where not exists (select 1 from portfolio_projects);

-- ---- legal pages (generic starting text, NOT legal advice: have it reviewed before launch)
insert into site_settings (key, value) values ('legal', jsonb_build_object(
  'terms_fr', '<h2>Conditions générales</h2><p>Les présentes conditions encadrent les demandes de devis et les prestations de développement proposées sur ce site.</p><h3>Estimation et devis</h3><p>Les prix affichés sont des <strong>estimations</strong>. Le prix final est confirmé par un devis écrit après un rendez-vous.</p><h3>Paiement</h3><p>Un acompte est demandé au démarrage ; le solde est dû à la livraison.</p><h3>Délais</h3><p>Les délais sont indicatifs et dépendent de la réactivité du client pour fournir contenus et validations.</p>',
  'terms_en', '<h2>Terms & conditions</h2><p>These terms govern quote requests and development services offered on this site.</p><h3>Estimates and quotes</h3><p>Displayed prices are <strong>estimates</strong>. The final price is confirmed in a written quote after a meeting.</p><h3>Payment</h3><p>A deposit is requested at the start; the balance is due on delivery.</p><h3>Deadlines</h3><p>Deadlines are indicative and depend on the client providing content and approvals on time.</p>',
  'terms_ar', '<h2>الشروط والأحكام</h2><p>تنظم هذه الشروط طلبات عروض الأسعار وخدمات التطوير المقدمة عبر هذا الموقع.</p><h3>التقدير وعرض السعر</h3><p>الأسعار المعروضة هي <strong>تقديرات</strong>. يتم تأكيد السعر النهائي في عرض مكتوب بعد اجتماع.</p><h3>الدفع</h3><p>يُطلب عربون عند البدء ويُدفع الباقي عند التسليم.</p>',
  'privacy_fr', '<h2>Politique de confidentialité</h2><p>Nous collectons uniquement les informations que vous saisissez dans les formulaires (nom, e-mail, téléphone, détails du projet, fichiers) afin de traiter votre demande et de vous contacter.</p><h3>Conservation</h3><p>Vos données sont conservées le temps nécessaire au suivi de votre projet.</p><h3>Vos droits</h3><p>Vous pouvez demander l''accès, la correction ou la suppression de vos données en nous contactant.</p>',
  'privacy_en', '<h2>Privacy policy</h2><p>We only collect the information you enter in our forms (name, email, phone, project details, files) to process your request and contact you.</p><h3>Retention</h3><p>Your data is kept as long as needed to follow your project.</p><h3>Your rights</h3><p>You can ask to access, correct or delete your data by contacting us.</p>',
  'privacy_ar', '<h2>سياسة الخصوصية</h2><p>نجمع فقط المعلومات التي تدخلها في النماذج (الاسم والبريد والهاتف وتفاصيل المشروع والملفات) لمعالجة طلبك والتواصل معك.</p><h3>حقوقك</h3><p>يمكنك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها بالتواصل معنا.</p>'
)) on conflict (key) do nothing;

-- ---- site contact address
update site_settings set value = jsonb_set(value, '{address}', '"Rabat, Maroc"') where key = 'contact' and coalesce(value->>'address', '') = '';
