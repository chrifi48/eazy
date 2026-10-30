-- Packages rewritten so Basic ⊂ Pro ⊂ Premium: the comparison table then shows clear ticks.
-- Prices are unchanged (edit them in Admin → Packages).

update packages set
  description_fr = 'Pour démarrer simplement', description_en = 'To get started simply', description_ar = 'للبدء ببساطة',
  items_fr = '["Design responsive","Formulaire de contact","SEO de base","Support après livraison (1 mois)","Jusqu''à 5 pages"]'::jsonb,
  items_en = '["Responsive design","Contact form","Basic SEO","Post-launch support (1 month)","Up to 5 pages"]'::jsonb,
  items_ar = '["تصميم متجاوب","نموذج اتصال","تحسين أساسي لمحركات البحث","دعم بعد التسليم (شهر)","حتى 5 صفحات"]'::jsonb
where name_en = 'Basic' and kind = 'project';

update packages set
  description_fr = 'Le plus choisi par nos clients', description_en = 'Most chosen by our clients', description_ar = 'الأكثر اختياراً من عملائنا',
  items_fr = '["Design responsive","Formulaire de contact","SEO de base","Support après livraison (3 mois)","Pages illimitées","Panneau d''administration","Multilingue (FR/AR/EN)","SEO avancé","Statistiques de visites"]'::jsonb,
  items_en = '["Responsive design","Contact form","Basic SEO","Post-launch support (3 months)","Unlimited pages","Admin panel","Multi-language (FR/AR/EN)","Advanced SEO","Visitor analytics"]'::jsonb,
  items_ar = '["تصميم متجاوب","نموذج اتصال","تحسين أساسي لمحركات البحث","دعم بعد التسليم (3 أشهر)","صفحات غير محدودة","لوحة تحكم","متعدد اللغات (فرنسية/عربية/إنجليزية)","تحسين متقدم لمحركات البحث","إحصاءات الزيارات"]'::jsonb
where name_en = 'Pro' and kind = 'project';

update packages set
  description_fr = 'Solution complète et sur mesure', description_en = 'Complete, fully custom solution', description_ar = 'حل كامل وبتصميم خاص',
  items_fr = '["Design responsive","Formulaire de contact","SEO de base","Support après livraison (12 mois)","Pages illimitées","Panneau d''administration","Multilingue (FR/AR/EN)","SEO avancé","Statistiques de visites","Design sur mesure","Intégrations API","Paiement en ligne","Formation à l''utilisation","Support prioritaire"]'::jsonb,
  items_en = '["Responsive design","Contact form","Basic SEO","Post-launch support (12 months)","Unlimited pages","Admin panel","Multi-language (FR/AR/EN)","Advanced SEO","Visitor analytics","Custom design","API integrations","Online payment","Training","Priority support"]'::jsonb,
  items_ar = '["تصميم متجاوب","نموذج اتصال","تحسين أساسي لمحركات البحث","دعم بعد التسليم (12 شهراً)","صفحات غير محدودة","لوحة تحكم","متعدد اللغات (فرنسية/عربية/إنجليزية)","تحسين متقدم لمحركات البحث","إحصاءات الزيارات","تصميم خاص","ربط واجهات API","الدفع الإلكتروني","تدريب على الاستخدام","دعم ذو أولوية"]'::jsonb
where name_en = 'Premium' and kind = 'project';

update packages set
  description_fr = 'Hébergement et maintenance mensuels', description_en = 'Monthly hosting and maintenance', description_ar = 'استضافة وصيانة شهرية'
where name_en = 'Standard Maintenance';
update packages set
  description_fr = 'Tout inclus pour une année', description_en = 'Everything included for a year', description_ar = 'كل شيء مشمول لمدة سنة'
where name_en = 'Hosting + Maintenance';
