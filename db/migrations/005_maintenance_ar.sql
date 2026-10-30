-- Arabic items for the maintenance / hosting plans (they fell back to French)
update packages set items_ar = '["تحديثات","نسخ احتياطي","دعم عبر البريد الإلكتروني"]'::jsonb
where name_en = 'Standard Maintenance' and kind = 'maintenance';

update packages set items_ar = '["استضافة","اسم نطاق","صيانة","دعم ذو أولوية"]'::jsonb
where name_en = 'Hosting + Maintenance' and kind = 'maintenance';
