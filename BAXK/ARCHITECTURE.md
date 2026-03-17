# Architecture Produit

## Base de donnees cible

Base recommandee: PostgreSQL.

Tables coeur:

- `users`
  - `id`, `display_name`, `email`, `role`, `is_active`, `created_at`, `updated_at`
- `companies`
  - `id`, `name`, `postal_code`, `city`, `notes`, `created_at`, `updated_at`, `archived_at`
- `company_contacts`
  - `id`, `company_id`, `first_name`, `last_name`, `job_title`, `phone`, `email`, `notes`, `is_primary`
- `dtf_requests`
  - `id`, `company_id`, `dimensions`, `design_name`, `size`, `color`, `technical_note`, `quantity`, `status`, `session_label`, `created_at`, `updated_at`, `archived_at`
- `textile_purchase_orders`
  - `id`, `company_id`, `supplier_name`, `session_label`, `expected_date`, `delivery_status`, `notes`, `created_at`, `updated_at`, `archived_at`
- `textile_purchase_order_items`
  - `id`, `purchase_order_id`, `brand`, `gender`, `designation`, `catalog_reference`, `color`, `size`, `quantity`
- `purchase_zones`
  - `id`, `code`, `label`, `sort_order`
- `purchase_items`
  - `id`, `zone_id`, `label`, `quantity`, `unit`, `is_completed`, `completed_at`, `created_at`, `updated_at`, `archived_at`
- `workshop_task_groups`
  - `id`, `code`, `label`, `sort_order`
- `workshop_tasks`
  - `id`, `group_id`, `label`, `description`, `is_completed`, `completed_at`, `is_recurring`, `recurrence_type`, `created_at`, `updated_at`, `archived_at`
- `activity_logs`
  - `id`, `entity_type`, `entity_id`, `action`, `payload_json`, `user_id`, `created_at`

Relations:

- `companies` 1 -> N `company_contacts`
- `companies` 1 -> N `dtf_requests`
- `companies` 1 -> N `textile_purchase_orders`
- `textile_purchase_orders` 1 -> N `textile_purchase_order_items`
- `purchase_zones` 1 -> N `purchase_items`
- `workshop_task_groups` 1 -> N `workshop_tasks`

## Strategie UI/UX

Direction:

- interface lumineuse, calme, peu chargee
- recherche globale par module
- une action principale visible par ecran
- edition inline quand c'est possible
- archives separees du flux actif
- suppression rapide pour les listes operationnelles

Composants retenus:

- sidebar fixe pour les modules
- topbar avec recherche + creation
- cartes d'indicateurs synthese
- liste expandable pour `Clients Pro`
- data table dense pour `Demande de DTF`
- data table triable pour `Achat Textile`
- colonnes par zone pour `Achat`
- colonnes checklist pour `Gestion d'atelier`
- dialog natif pour les creations

## Etat du prototype courant

Le prototype actuel est volontairement front-only:

- stockage local via `localStorage`
- aucun backend
- aucun systeme d'authentification
- modules prioritaires deja interactifs

Prochaine etape logique:

1. brancher une API
2. migrer le stockage local vers PostgreSQL
3. ajouter auth et roles
4. ajouter historique par utilisateur
