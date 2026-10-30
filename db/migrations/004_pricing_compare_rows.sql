-- Items that differ by a value in parentheses (pages, support duration) become ONE row in the comparison table.

update packages set
  items_fr = '["Design responsive","Formulaire de contact","SEO de base","Pages (jusqu''à 5)","Support après livraison (1 mois)"]'::jsonb,
  items_en = '["Responsive design","Contact form","Basic SEO","Pages (up to 5)","Post-launch support (1 month)"]'::jsonb,
  items_ar = '["تصميم متجاوب","نموذج اتصال","تحسين أساسي لمحركات البحث","الصفحات (حتى 5)","دعم بعد التسليم (شهر)"]'::jsonb
where name_en = 'Basic' and kind = 'project';

update packages set
  items_fr = '["Design responsive","Formulaire de contact","SEO de base","Pages (illimitées)","Support après livraison (3 mois)","Panneau d''administration","Multilingue FR / AR / EN","SEO avancé","Statistiques de visites"]'::jsonb,
  items_en = '["Responsive design","Contact form","Basic SEO","Pages (unlimited)","Post-launch support (3 months)","Admin panel","Multi-language FR / AR / EN","Advanced SEO","Visitor analytics"]'::jsonb,
  items_ar = '["تصميم متجاوب","نموذج اتصال","تحسين أساسي لمحركات البحث","الصفحات (غير محدودة)","دعم بعد التسليم (3 أشهر)","لوحة تحكم","متعدد اللغات فرنسية / عربية / إنجليزية","تحسين متقدم لمحركات البحث","إحصاءات الزيارات"]'::jsonb
where name_en = 'Pro' and kind = 'project';

update packages set
  items_fr = '["Design responsive","Formulaire de contact","SEO de base","Pages (illimitées)","Support après livraison (12 mois)","Panneau d''administration","Multilingue FR / AR / EN","SEO avancé","Statistiques de visites","Design sur mesure","Intégrations API","Paiement en ligne","Formation à l''utilisation","Support prioritaire"]'::jsonb,
  items_en = '["Responsive design","Contact form","Basic SEO","Pages (unlimited)","Post-launch support (12 months)","Admin panel","Multi-language FR / AR / EN","Advanced SEO","Visitor analytics","Custom design","API integrations","Online payment","Training","Priority support"]'::jsonb,
  items_ar = '["تصميم متجاوب","نموذج اتصال","تحسين أساسي لمحركات البحث","الصفحات (غير محدودة)","دعم بعد التسليم (12 شهراً)","لوحة تحكم","متعدد اللغات فرنسية / عربية / إنجليزية","تحسين متقدم لمحركات البحث","إحصاءات الزيارات","تصميم خاص","ربط واجهات API","الدفع الإلكتروني","تدريب على الاستخدام","دعم ذو أولوية"]'::jsonb
where name_en = 'Premium' and kind = 'project';
