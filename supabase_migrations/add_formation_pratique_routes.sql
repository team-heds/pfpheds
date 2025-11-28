-- ========================================
-- AJOUT DES ROUTES FORMATION PRATIQUE PHYSIO
-- ========================================
-- Ce fichier ajoute toutes les routes de la nouvelle section "Formation Pratique Physio"
-- à la table dynamic_routes pour le routeur dynamique

-- Dashboard Formation Pratique
INSERT INTO dynamic_routes (
  path, 
  name, 
  component_path, 
  requires_auth, 
  is_active, 
  need, 
  menu_section, 
  menu_label, 
  menu_icon, 
  menu_order
) VALUES (
  '/admin/formation-pratique/dashboard',
  'DashboardFormationPratique',
  '@/views/admin/formation-pratique/DashboardFormationPratiqueView.vue',
  true,
  true,
  'page1.access',
  'Formation Pratique Physio',
  'Dashboard Formation Pratique',
  'pi pi-chart-bar',
  500
) ON CONFLICT (path) DO UPDATE SET
  name = EXCLUDED.name,
  component_path = EXCLUDED.component_path,
  requires_auth = EXCLUDED.requires_auth,
  is_active = EXCLUDED.is_active,
  need = EXCLUDED.need,
  menu_section = EXCLUDED.menu_section,
  menu_label = EXCLUDED.menu_label,
  menu_icon = EXCLUDED.menu_icon,
  menu_order = EXCLUDED.menu_order;

-- ========================================
-- SECTION DONNÉES
-- ========================================

-- Étudiants
INSERT INTO dynamic_routes (
  path, 
  name, 
  component_path, 
  requires_auth, 
  is_active, 
  need, 
  menu_section, 
  menu_label, 
  menu_icon, 
  menu_order
) VALUES (
  '/admin/formation-pratique/etudiants',
  'FPEtudiants',
  '@/views/admin/formation-pratique/EtudiantsView.vue',
  true,
  true,
  'page1.access',
  'Formation Pratique Physio',
  'Étudiants',
  'pi pi-users',
  510
) ON CONFLICT (path) DO UPDATE SET
  name = EXCLUDED.name,
  component_path = EXCLUDED.component_path,
  requires_auth = EXCLUDED.requires_auth,
  is_active = EXCLUDED.is_active,
  need = EXCLUDED.need,
  menu_section = EXCLUDED.menu_section,
  menu_label = EXCLUDED.menu_label,
  menu_icon = EXCLUDED.menu_icon,
  menu_order = EXCLUDED.menu_order;

-- Institutions
INSERT INTO dynamic_routes (
  path, 
  name, 
  component_path, 
  requires_auth, 
  is_active, 
  need, 
  menu_section, 
  menu_label, 
  menu_icon, 
  menu_order
) VALUES (
  '/admin/formation-pratique/institutions',
  'FPInstitutions',
  '@/views/admin/formation-pratique/InstitutionsView.vue',
  true,
  true,
  'page1.access',
  'Formation Pratique Physio',
  'Institutions',
  'pi pi-building',
  511
) ON CONFLICT (path) DO UPDATE SET
  name = EXCLUDED.name,
  component_path = EXCLUDED.component_path,
  requires_auth = EXCLUDED.requires_auth,
  is_active = EXCLUDED.is_active,
  need = EXCLUDED.need,
  menu_section = EXCLUDED.menu_section,
  menu_label = EXCLUDED.menu_label,
  menu_icon = EXCLUDED.menu_icon,
  menu_order = EXCLUDED.menu_order;

-- Praticiens Formateur
INSERT INTO dynamic_routes (
  path, 
  name, 
  component_path, 
  requires_auth, 
  is_active, 
  need, 
  menu_section, 
  menu_label, 
  menu_icon, 
  menu_order
) VALUES (
  '/admin/formation-pratique/praticiens-formateur',
  'FPPraticiensFormateur',
  '@/views/admin/formation-pratique/PraticiensFormateurView.vue',
  true,
  true,
  'page1.access',
  'Formation Pratique Physio',
  'Praticiens Formateur',
  'pi pi-user-plus',
  512
) ON CONFLICT (path) DO UPDATE SET
  name = EXCLUDED.name,
  component_path = EXCLUDED.component_path,
  requires_auth = EXCLUDED.requires_auth,
  is_active = EXCLUDED.is_active,
  need = EXCLUDED.need,
  menu_section = EXCLUDED.menu_section,
  menu_label = EXCLUDED.menu_label,
  menu_icon = EXCLUDED.menu_icon,
  menu_order = EXCLUDED.menu_order;

-- Places
INSERT INTO dynamic_routes (
  path, 
  name, 
  component_path, 
  requires_auth, 
  is_active, 
  need, 
  menu_section, 
  menu_label, 
  menu_icon, 
  menu_order
) VALUES (
  '/admin/formation-pratique/places',
  'FPPlaces',
  '@/views/admin/formation-pratique/PlacesView.vue',
  true,
  true,
  'page1.access',
  'Formation Pratique Physio',
  'Places',
  'pi pi-map-marker',
  513
) ON CONFLICT (path) DO UPDATE SET
  name = EXCLUDED.name,
  component_path = EXCLUDED.component_path,
  requires_auth = EXCLUDED.requires_auth,
  is_active = EXCLUDED.is_active,
  need = EXCLUDED.need,
  menu_section = EXCLUDED.menu_section,
  menu_label = EXCLUDED.menu_label,
  menu_icon = EXCLUDED.menu_icon,
  menu_order = EXCLUDED.menu_order;

-- ========================================
-- SECTION ADMIN
-- ========================================

-- Profil Étudiants
INSERT INTO dynamic_routes (
  path, 
  name, 
  component_path, 
  requires_auth, 
  is_active, 
  need, 
  menu_section, 
  menu_label, 
  menu_icon, 
  menu_order
) VALUES (
  '/admin/formation-pratique/profil-etudiants',
  'FPProfilEtudiants',
  '@/views/admin/formation-pratique/ProfilEtudiantsView.vue',
  true,
  true,
  'page1.access',
  'Formation Pratique Physio',
  'Profil Étudiants',
  'pi pi-id-card',
  520
) ON CONFLICT (path) DO UPDATE SET
  name = EXCLUDED.name,
  component_path = EXCLUDED.component_path,
  requires_auth = EXCLUDED.requires_auth,
  is_active = EXCLUDED.is_active,
  need = EXCLUDED.need,
  menu_section = EXCLUDED.menu_section,
  menu_label = EXCLUDED.menu_label,
  menu_icon = EXCLUDED.menu_icon,
  menu_order = EXCLUDED.menu_order;

-- Profil Répondant Enseignant
INSERT INTO dynamic_routes (
  path, 
  name, 
  component_path, 
  requires_auth, 
  is_active, 
  need, 
  menu_section, 
  menu_label, 
  menu_icon, 
  menu_order
) VALUES (
  '/admin/formation-pratique/profil-repondant-enseignant',
  'FPProfilRepondantEnseignant',
  '@/views/admin/formation-pratique/ProfilRepondantEnseignantView.vue',
  true,
  true,
  'page1.access',
  'Formation Pratique Physio',
  'Profil Répondant Enseignant',
  'pi pi-user',
  521
) ON CONFLICT (path) DO UPDATE SET
  name = EXCLUDED.name,
  component_path = EXCLUDED.component_path,
  requires_auth = EXCLUDED.requires_auth,
  is_active = EXCLUDED.is_active,
  need = EXCLUDED.need,
  menu_section = EXCLUDED.menu_section,
  menu_label = EXCLUDED.menu_label,
  menu_icon = EXCLUDED.menu_icon,
  menu_order = EXCLUDED.menu_order;

-- Gantt PFP
INSERT INTO dynamic_routes (
  path, 
  name, 
  component_path, 
  requires_auth, 
  is_active, 
  need, 
  menu_section, 
  menu_label, 
  menu_icon, 
  menu_order
) VALUES (
  '/admin/formation-pratique/gantt-pfp',
  'FPGanttPFP',
  '@/views/admin/formation-pratique/GanttPFPFormationView.vue',
  true,
  true,
  'page1.access',
  'Formation Pratique Physio',
  'Gantt PFP',
  'pi pi-chart-line',
  522
) ON CONFLICT (path) DO UPDATE SET
  name = EXCLUDED.name,
  component_path = EXCLUDED.component_path,
  requires_auth = EXCLUDED.requires_auth,
  is_active = EXCLUDED.is_active,
  need = EXCLUDED.need,
  menu_section = EXCLUDED.menu_section,
  menu_label = EXCLUDED.menu_label,
  menu_icon = EXCLUDED.menu_icon,
  menu_order = EXCLUDED.menu_order;

-- Admin Secrétariat
INSERT INTO dynamic_routes (
  path, 
  name, 
  component_path, 
  requires_auth, 
  is_active, 
  need, 
  menu_section, 
  menu_label, 
  menu_icon, 
  menu_order
) VALUES (
  '/admin/formation-pratique/admin-secretariat',
  'FPAdminSecretariat',
  '@/views/admin/formation-pratique/AdminSecretariatView.vue',
  true,
  true,
  'page1.access',
  'Formation Pratique Physio',
  'Admin Secrétariat',
  'pi pi-briefcase',
  523
) ON CONFLICT (path) DO UPDATE SET
  name = EXCLUDED.name,
  component_path = EXCLUDED.component_path,
  requires_auth = EXCLUDED.requires_auth,
  is_active = EXCLUDED.is_active,
  need = EXCLUDED.need,
  menu_section = EXCLUDED.menu_section,
  menu_label = EXCLUDED.menu_label,
  menu_icon = EXCLUDED.menu_icon,
  menu_order = EXCLUDED.menu_order;

-- Management Répondant CPT
INSERT INTO dynamic_routes (
  path, 
  name, 
  component_path, 
  requires_auth, 
  is_active, 
  need, 
  menu_section, 
  menu_label, 
  menu_icon, 
  menu_order
) VALUES (
  '/admin/formation-pratique/management-repondant-cpt',
  'FPManagementRepondantCPT',
  '@/views/admin/formation-pratique/ManagementRepondantCPTView.vue',
  true,
  true,
  'page1.access',
  'Formation Pratique Physio',
  'Management Répondant CPT',
  'pi pi-users',
  524
) ON CONFLICT (path) DO UPDATE SET
  name = EXCLUDED.name,
  component_path = EXCLUDED.component_path,
  requires_auth = EXCLUDED.requires_auth,
  is_active = EXCLUDED.is_active,
  need = EXCLUDED.need,
  menu_section = EXCLUDED.menu_section,
  menu_label = EXCLUDED.menu_label,
  menu_icon = EXCLUDED.menu_icon,
  menu_order = EXCLUDED.menu_order;

-- Management Feuille De Charge Répondant CPT
INSERT INTO dynamic_routes (
  path, 
  name, 
  component_path, 
  requires_auth, 
  is_active, 
  need, 
  menu_section, 
  menu_label, 
  menu_icon, 
  menu_order
) VALUES (
  '/admin/formation-pratique/management-feuille-charge-cpt',
  'FPManagementFeuilleChargeCPT',
  '@/views/admin/formation-pratique/ManagementFeuilleDeChargeRepondantCPTView.vue',
  true,
  true,
  'page1.access',
  'Formation Pratique Physio',
  'Management Feuille De Charge Répondant CPT',
  'pi pi-file',
  525
) ON CONFLICT (path) DO UPDATE SET
  name = EXCLUDED.name,
  component_path = EXCLUDED.component_path,
  requires_auth = EXCLUDED.requires_auth,
  is_active = EXCLUDED.is_active,
  need = EXCLUDED.need,
  menu_section = EXCLUDED.menu_section,
  menu_label = EXCLUDED.menu_label,
  menu_icon = EXCLUDED.menu_icon,
  menu_order = EXCLUDED.menu_order;

-- ========================================
-- SECTION PÉRIODE DE FORMATION PRATIQUE
-- ========================================

-- Offre De Place
INSERT INTO dynamic_routes (
  path, 
  name, 
  component_path, 
  requires_auth, 
  is_active, 
  need, 
  menu_section, 
  menu_label, 
  menu_icon, 
  menu_order
) VALUES (
  '/admin/formation-pratique/offre-place',
  'FPOffrePlace',
  '@/views/admin/formation-pratique/OffreDePlaceView.vue',
  true,
  true,
  'page1.access',
  'Formation Pratique Physio',
  'Offre De Place',
  'pi pi-list',
  530
) ON CONFLICT (path) DO UPDATE SET
  name = EXCLUDED.name,
  component_path = EXCLUDED.component_path,
  requires_auth = EXCLUDED.requires_auth,
  is_active = EXCLUDED.is_active,
  need = EXCLUDED.need,
  menu_section = EXCLUDED.menu_section,
  menu_label = EXCLUDED.menu_label,
  menu_icon = EXCLUDED.menu_icon,
  menu_order = EXCLUDED.menu_order;

-- Preview PFP
INSERT INTO dynamic_routes (
  path, 
  name, 
  component_path, 
  requires_auth, 
  is_active, 
  need, 
  menu_section, 
  menu_label, 
  menu_icon, 
  menu_order
) VALUES (
  '/admin/formation-pratique/preview-pfp',
  'FPPreviewPFP',
  '@/views/admin/formation-pratique/PreviewPFPView.vue',
  true,
  true,
  'page1.access',
  'Formation Pratique Physio',
  'Preview PFP',
  'pi pi-eye',
  531
) ON CONFLICT (path) DO UPDATE SET
  name = EXCLUDED.name,
  component_path = EXCLUDED.component_path,
  requires_auth = EXCLUDED.requires_auth,
  is_active = EXCLUDED.is_active,
  need = EXCLUDED.need,
  menu_section = EXCLUDED.menu_section,
  menu_label = EXCLUDED.menu_label,
  menu_icon = EXCLUDED.menu_icon,
  menu_order = EXCLUDED.menu_order;

-- Résultat Votation Prioritaire
INSERT INTO dynamic_routes (
  path, 
  name, 
  component_path, 
  requires_auth, 
  is_active, 
  need, 
  menu_section, 
  menu_label, 
  menu_icon, 
  menu_order
) VALUES (
  '/admin/formation-pratique/resultat-votation-prioritaire',
  'FPResultatVotationPrioritaire',
  '@/views/admin/formation-pratique/ResultatVotationPrioritaireView.vue',
  true,
  true,
  'page1.access',
  'Formation Pratique Physio',
  'Résultat Votation Prioritaire',
  'pi pi-chart-pie',
  532
) ON CONFLICT (path) DO UPDATE SET
  name = EXCLUDED.name,
  component_path = EXCLUDED.component_path,
  requires_auth = EXCLUDED.requires_auth,
  is_active = EXCLUDED.is_active,
  need = EXCLUDED.need,
  menu_section = EXCLUDED.menu_section,
  menu_label = EXCLUDED.menu_label,
  menu_icon = EXCLUDED.menu_icon,
  menu_order = EXCLUDED.menu_order;

-- Résultat Votation PFP
INSERT INTO dynamic_routes (
  path, 
  name, 
  component_path, 
  requires_auth, 
  is_active, 
  need, 
  menu_section, 
  menu_label, 
  menu_icon, 
  menu_order
) VALUES (
  '/admin/formation-pratique/resultat-votation-pfp',
  'FPResultatVotationPFP',
  '@/views/admin/formation-pratique/ResultatVotationPFPView.vue',
  true,
  true,
  'page1.access',
  'Formation Pratique Physio',
  'Résultat Votation PFP',
  'pi pi-chart-bar',
  533
) ON CONFLICT (path) DO UPDATE SET
  name = EXCLUDED.name,
  component_path = EXCLUDED.component_path,
  requires_auth = EXCLUDED.requires_auth,
  is_active = EXCLUDED.is_active,
  need = EXCLUDED.need,
  menu_section = EXCLUDED.menu_section,
  menu_label = EXCLUDED.menu_label,
  menu_icon = EXCLUDED.menu_icon,
  menu_order = EXCLUDED.menu_order;

-- Management Répondant Votation
INSERT INTO dynamic_routes (
  path, 
  name, 
  component_path, 
  requires_auth, 
  is_active, 
  need, 
  menu_section, 
  menu_label, 
  menu_icon, 
  menu_order
) VALUES (
  '/admin/formation-pratique/management-repondant-votation',
  'FPManagementRepondantVotation',
  '@/views/admin/formation-pratique/ManagementRepondantVotationView.vue',
  true,
  true,
  'page1.access',
  'Formation Pratique Physio',
  'Management Répondant Votation',
  'pi pi-user-edit',
  534
) ON CONFLICT (path) DO UPDATE SET
  name = EXCLUDED.name,
  component_path = EXCLUDED.component_path,
  requires_auth = EXCLUDED.requires_auth,
  is_active = EXCLUDED.is_active,
  need = EXCLUDED.need,
  menu_section = EXCLUDED.menu_section,
  menu_label = EXCLUDED.menu_label,
  menu_icon = EXCLUDED.menu_icon,
  menu_order = EXCLUDED.menu_order;

-- Valider Échec PFP
INSERT INTO dynamic_routes (
  path, 
  name, 
  component_path, 
  requires_auth, 
  is_active, 
  need, 
  menu_section, 
  menu_label, 
  menu_icon, 
  menu_order
) VALUES (
  '/admin/formation-pratique/valider-echec-pfp',
  'FPValiderEchecPFP',
  '@/views/admin/formation-pratique/ValiderEchecPFPView.vue',
  true,
  true,
  'page1.access',
  'Formation Pratique Physio',
  'Valider Échec PFP',
  'pi pi-check-circle',
  535
) ON CONFLICT (path) DO UPDATE SET
  name = EXCLUDED.name,
  component_path = EXCLUDED.component_path,
  requires_auth = EXCLUDED.requires_auth,
  is_active = EXCLUDED.is_active,
  need = EXCLUDED.need,
  menu_section = EXCLUDED.menu_section,
  menu_label = EXCLUDED.menu_label,
  menu_icon = EXCLUDED.menu_icon,
  menu_order = EXCLUDED.menu_order;

-- ========================================
-- SECTION VOTATIONS
-- ========================================

-- Votation Prioritaire
INSERT INTO dynamic_routes (
  path, 
  name, 
  component_path, 
  requires_auth, 
  is_active, 
  need, 
  menu_section, 
  menu_label, 
  menu_icon, 
  menu_order
) VALUES (
  '/admin/formation-pratique/votation-prioritaire',
  'FPVotationPrioritaire',
  '@/views/admin/formation-pratique/VotationPrioritaireView.vue',
  true,
  true,
  'page1.access',
  'Formation Pratique Physio',
  'Votation Prioritaire',
  'pi pi-star',
  540
) ON CONFLICT (path) DO UPDATE SET
  name = EXCLUDED.name,
  component_path = EXCLUDED.component_path,
  requires_auth = EXCLUDED.requires_auth,
  is_active = EXCLUDED.is_active,
  need = EXCLUDED.need,
  menu_section = EXCLUDED.menu_section,
  menu_label = EXCLUDED.menu_label,
  menu_icon = EXCLUDED.menu_icon,
  menu_order = EXCLUDED.menu_order;

-- Votation PFP
INSERT INTO dynamic_routes (
  path, 
  name, 
  component_path, 
  requires_auth, 
  is_active, 
  need, 
  menu_section, 
  menu_label, 
  menu_icon, 
  menu_order
) VALUES (
  '/admin/formation-pratique/votation-pfp',
  'FPVotationPFP',
  '@/views/admin/formation-pratique/VotationPFPView.vue',
  true,
  true,
  'page1.access',
  'Formation Pratique Physio',
  'Votation PFP',
  'pi pi-check-square',
  541
) ON CONFLICT (path) DO UPDATE SET
  name = EXCLUDED.name,
  component_path = EXCLUDED.component_path,
  requires_auth = EXCLUDED.requires_auth,
  is_active = EXCLUDED.is_active,
  need = EXCLUDED.need,
  menu_section = EXCLUDED.menu_section,
  menu_label = EXCLUDED.menu_label,
  menu_icon = EXCLUDED.menu_icon,
  menu_order = EXCLUDED.menu_order;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Toutes les routes Formation Pratique Physio ont été ajoutées avec succès!';
  RAISE NOTICE '📊 Nombre total de routes ajoutées: 19';
END $$;
