const STORAGE_KEY = "dasholda.erp.v3";
const STORAGE_MIRROR_KEY = `${STORAGE_KEY}.mirror`;
const STORAGE_BACKUPS_KEY = `${STORAGE_KEY}.backups`;
const SHEET_DRAFTS_KEY = `${STORAGE_KEY}.sheetDrafts`;
const MAX_STORAGE_BACKUPS = 20;
const DATA_VERSION = 3;
const SERVER_DB_ENDPOINT = "/api/db";
const REMOTE_SYNC_INTERVAL_MS = 3000;
const REMOTE_SAVE_DEBOUNCE_MS = 500;
const deepClone = typeof structuredClone === "function"
  ? (value) => structuredClone(value)
  : (value) => JSON.parse(JSON.stringify(value));

const views = {
  tasks: {
    label: "Tâches",
    eyebrow: "Tâches",
    intro: "",
    primaryAction: null,
    searchPlaceholder: "Rechercher dans les notes..."
  },
  testPlanning: {
    label: "Commandes générales",
    eyebrow: "Commandes générales",
    intro: "",
    primaryAction: "addTestPlanningOrder",
    searchPlaceholder: "Rechercher..."
  },
  clients: {
    label: "Clients Pro",
    eyebrow: "Clients",
    intro: "",
    primaryAction: "addClient",
    searchPlaceholder: "Rechercher..."
  },
  dtf: {
    label: "Demande DTF",
    eyebrow: "DTF",
    intro: "",
    primaryAction: "addDtf",
    searchPlaceholder: "Rechercher..."
  },
  dtfMockups: {
    label: "Maquette à faire",
    eyebrow: "DTF",
    intro: "",
    primaryAction: null,
    searchPlaceholder: "Rechercher..."
  },
  production: {
    label: "Production",
    eyebrow: "Production",
    intro: "",
    primaryAction: "addProductionItem",
    searchPlaceholder: "Rechercher..."
  },
  workshop: {
    label: "Gestion d'atelier",
    eyebrow: "Atelier",
    intro: "",
    primaryAction: "addWorkshopTask",
    searchPlaceholder: "Rechercher..."
  },
  purchase: {
    label: "Achat",
    eyebrow: "Achat",
    intro: "",
    primaryAction: "addPurchaseItem",
    searchPlaceholder: "Rechercher..."
  },
  textile: {
    label: "Achat Textile",
    eyebrow: "Textile",
    intro: "",
    primaryAction: "addTextileOrder",
    searchPlaceholder: "Rechercher..."
  },
  improvements: {
    label: "Améliorations",
    eyebrow: "Améliorations",
    intro: "",
    primaryAction: null,
    searchPlaceholder: "Rechercher..."
  }
};

const TEST_PLANNING_STAGES = [
  {
    key: "demande",
    label: "1. Demande",
    shortLabel: "Demande",
    accent: "blue",
    statuses: ["Devis à faire", "Pas urgent", "Manque information", "Pas de Stock"]
  },
  {
    key: "devis",
    label: "2. Devis en cours",
    shortLabel: "Devis en cours",
    accent: "violet",
    statuses: ["Devis en attente validation", "Modification devis", "Manque information", "Maquette à faire"]
  },
  {
    key: "accepted",
    label: "3. Devis accepté",
    shortLabel: "Accepté",
    accent: "orange",
    statuses: ["Préparation du produit", "Attente Marchandise", "Maquette en cours de validation"]
  },
  {
    key: "production",
    label: "4. Production",
    shortLabel: "Production",
    accent: "green",
    statuses: ["PRT à faire", "A produire", "En cours", "Manque information"]
  },
  {
    key: "facture",
    label: "5. Facturé",
    shortLabel: "Facturé",
    accent: "rose",
    statuses: ["Commande Terminé", "Client prévenu", "Commande récupéré"]
  },
  {
    key: "paye",
    label: "6. Payé",
    shortLabel: "Payé",
    accent: "cyan",
    statuses: ["Payé en boutique", "Payé par virement prochainement", "Manque information"]
  },
  {
    key: "archived",
    label: "7. Archivé",
    shortLabel: "Archivé",
    accent: "slate",
    statuses: ["Payé + Livré = Terminé"]
  }
];
const TEST_PLANNING_STAGE_KEYS = TEST_PLANNING_STAGES.map((stage) => stage.key);
const TEST_PLANNING_DEFAULT_STAGE = TEST_PLANNING_STAGES[0].key;
const TEST_PLANNING_CLIENT_TYPE_OPTIONS = ["", "PRO", "PERSO"];
const TEST_PLANNING_FAMILY_OPTIONS = ["", "TEXTILES", "TROTEC", "UV", "GOODIES", "AUTRES"];
const TEST_PLANNING_PRODUCT_OPTIONS = ["", "TSHIRT", "TSHIRT PRO", "SAC", "POCHETTE", "CASQUETTE"];
const TEST_PLANNING_STATUS_OPTIONS = TEST_PLANNING_STAGES.flatMap((stage) => stage.statuses);
const PRODUCTION_STATUS_OPTIONS = ["A imprimer", "Impression en cours", "Erreur", "Terminé"];
const PRODUCTION_STATUS_DEFAULT = "A imprimer";
const TEAM_NOTE_MEMBERS = ["Loic", "Charlie", "Melina", "Amandine"];
const IMPROVEMENT_TYPES = [
  { key: "bug", label: "Bug" },
  { key: "problem", label: "Probleme" },
  { key: "request", label: "Modification souhaitee" }
];
const ORDER_ASSIGNEES = ["L", "M", "C", "A", "R"];
const TEXTILE_COLUMN_DEFINITIONS = [
  { key: "client", label: "Client" },
  { key: "supplier", label: "Fournisseur" },
  { key: "brand", label: "Marque" },
  { key: "gender", label: "Genre" },
  { key: "designation", label: "Désignation" },
  { key: "catalogReference", label: "Référence" },
  { key: "color", label: "Couleur" },
  { key: "size", label: "Taille" },
  { key: "quantity", label: "Qté" },
  { key: "deliveryStatus", label: "Livraison" },
  { key: "sessionLabel", label: "Session" },
  { key: "expectedDate", label: "Date" }
];
const TEXTILE_SUPPLIER_OPTIONS = ["Toptex", "Wordans"];
const TEXTILE_BRAND_OPTIONS = ["-", "Native Spirit", "Westford Mill", "Gildan"];
const TEXTILE_GENDER_OPTIONS = ["-", "Mixte", "Homme", "Femme", "Enfant"];
const TEXTILE_DELIVERY_OPTIONS = ["pending", "maritime", "received"];
const TEXTILE_COLOR_OPTIONS = [
  "multicolor",
  "noir",
  "kaki",
  "bleu marine",
  "bleu royal",
  "rouge",
  "orange",
  "corail",
  "vert",
  "lavande",
  "rose bébé",
  "bleu clair",
  "vert pastel",
  "menthe",
  "jaune",
  "marron",
  "beige",
  "blanc"
];
const FRONT_LOGO_OPTIONS = ["FLE-PI", "PAL-PI", "COEUR-PI", "BEA-16", "TOR-04", "SXM-12 POITRINE", "SXM-20"];
const BACK_LOGO_OPTIONS = ["PAY-01", "SLO-01", "SXM-24", "COR-04", "COC-03", "GOO-01", "TEQ-01", "SXM-15", "PAL-16", "SXM-23", "VOI-02"];
const TEXTILE_ORDER_IMPORTS = [
  {
    clientName: "OLDA STD",
    supplier: "Toptex",
    brand: "-",
    gender: "-",
    designation: "Tote Bag",
    catalogReference: "KI3223",
    color: "nature",
    size: "S/M...",
    quantity: 200,
    deliveryStatus: "maritime",
    sessionLabel: "—",
    expectedDate: "2026-03-10",
    archivedAt: "",
    createdAt: "2026-03-16"
  }
];
const DEFAULT_PURCHASE_ITEMS = [
  { zone: "SXM", label: "Porte VU", checked: true },
  { zone: "SXM", label: "Sac 50L", checked: false },
  { zone: "SXM", label: "Piles Lithium CR2032", checked: false },
  { zone: "SXM", label: "Glue avec bouton pressoir sur le coté", checked: false },
  { zone: "Europe", label: "DTF Objets x25 :", checked: false },
  { zone: "Europe", label: "BEA-16 Bleu clair H=50 L=45", checked: false },
  { zone: "Europe", label: "BEA-16 Rose H=50 L=45", checked: false },
  { zone: "Europe", label: "BEA-13 Multi color H=48 L=60", checked: false },
  { zone: "Europe", label: "TOR-04 Blanc H=52 L=49", checked: false },
  { zone: "Europe", label: "DTF Objet x100 : Pas lave vaisselle", checked: false },
  { zone: "Europe", label: "SXM-12 Navy D=50", checked: false }
];
const DEFAULT_WORKSHOP_TASKS = [
  { group: "standard", label: "Laisser 1 Clim a 26° la nuit (AIRWELL)", recurring: true },
  { group: "standard", label: "Eteindre les multiprises de l'atelier ...", recurring: true },
  { group: "standard", label: "Allumer PC trotec pour syncro drop...", recurring: true },
  { group: "dtf", label: "Vider la colle chaque soir", recurring: true },
  { group: "dtf", label: "Vendredi nettoyage complet", recurring: true },
  { group: "dtf", label: "Checker les quantite d'encre chaqu...", recurring: true },
  { group: "dtf", label: "remettre la protection sur le papier ...", recurring: true },
  { group: "dtf", label: "Changement Papier le 06/03/26", recurring: false }
];
const SAMPLE_CLIENT_NAMES = new Set(["Hotel Rive Sud", "Festival Moko", "Maison Ledor"]);
const IMPORTED_CLIENT_DATE = "2026-03-16";
const importedContact = (name, role, phone = "", email = "") => ({ name, role, phone, email });
const IMPORTED_PRO_CLIENTS = [
  { name: "VOILA SXM", clientType: "Boutique", city: "GRAND CASE", contacts: [importedContact("Clara", "Patronne", "0690377241")] },
  { name: "SEA YOU", clientType: "Boutique", city: "GRAND CASE", contacts: [importedContact("Iris", "Patronne", "0690552585")] },
  { name: "BREAD N BUTTER", clientType: "Epicerie", city: "OYSTER POND", contacts: [importedContact("Sandra / Sylvain", "Patrons", "0690333519")] },
  { name: "JOA", clientType: "Restaurant", city: "BAIE ORIENTALE", contacts: [importedContact("Alexandre", "Patron", "0630010339")] },
  { name: "BEACHLIFE", clientType: "Boutique", city: "BAIE ORIENTALE", contacts: [importedContact("Jenni", "Patronne", "0690652190")] },
  { name: "LA PLAYA", clientType: "Hotel", city: "BAIE ORIENTALE", contacts: [importedContact("Caty", "Patronne", "0690279131")] },
  { name: "ORIENT BEACH HOTEL", clientType: "Hotel", city: "BAIE ORIENTALE", contacts: [importedContact("Myriam", "Patronne", "0690629097")] },
  { name: "PIOU", clientType: "Boutique", city: "HOPE ESTATE", contacts: [importedContact("Clara / Iris", "Patronnes")] },
  { name: "NSEA STEM", clientType: "Créatrice", city: "SAINT-BARTHELEMY", contacts: [importedContact("Andréa", "Patronne", "0659318983")] },
  {
    name: "IGUANA FITNESS",
    clientType: "Complexe Sportif",
    city: "GRAND CASE",
    contacts: [
      importedContact("Jérôme", "Patron", "0690662400"),
      importedContact("Pasqualine", "communication", "0677029350")
    ]
  },
  { name: "3SP", clientType: "Entretien", city: "?", contacts: [importedContact("Fabien", "Patron", "0690382769")] },
  { name: "ART FOR SCIENCES", clientType: "Association", city: "HOPE ESTATE", contacts: [importedContact("Mélanie", "Patronne", "0609531462")] },
  { name: "LA QUINTESSENCE", clientType: "Restaurant", city: "GRAND CASE", contacts: [importedContact("Olivier", "Patron", "0690711502")] },
  { name: "INTERIOR DESIGN", clientType: "Agenceur", city: "HOPE ESTATE", contacts: [importedContact("Joris", "communication", "0690485741")] },
  { name: "TI PALM", clientType: "Restaurant", city: "BAIE ORIENTALE", contacts: [importedContact("Sophie", "Patronne", "0690733700")] },
  { name: "BILLIE", clientType: "Boutique", city: "MARIGOT", contacts: [importedContact("Peal", "Patronne", "0690555343")] },
  { name: "ICON", clientType: "Boutique", city: "MARIGOT", contacts: [importedContact("Peal", "Patronne", "0690555343")] },
  { name: "FRIENDLY PADEL CLUB", clientType: "Complexe Sportif", city: "GRAND CASE", contacts: [importedContact("Camille", "Patronne com", "0690661498")] },
  {
    name: "LE TEMPS DES CERISES",
    clientType: "Restaurant",
    city: "GRAND CASE",
    contacts: [
      importedContact("Cédric", "Patron", "0690613009"),
      importedContact("Lucas", "Frère du patron & Beach Manager", "0646784546")
    ]
  },
  {
    name: "SIMA",
    clientType: "Agenceur",
    city: "HOPE ESTATE",
    contacts: [
      importedContact("Anais", "femme du gérant", "0690534369"),
      importedContact("Vincent", "Gérant", "0690543498")
    ]
  },
  { name: "PHARMACIE HOPE ESTATE", clientType: "Médical", city: "HOPE ESTATE", contacts: [importedContact("Julien", "Gérant", "0690777248")] },
  { name: "LA GAGNE BRASERO", clientType: "Restaurant", city: "-", contacts: [importedContact("Antoine", "Gérant", "0618631726")] },
  { name: "ONE LOVE", clientType: "Boutique", city: "HOPE ESTATE", contacts: [importedContact("Karine", "Gérant", "0690754191")] },
  { name: "KARIBUNI HOTEL", clientType: "Hotel", city: "CUL DE SAC", contacts: [importedContact("Manon", "fille de Gréant", "0690643858")] },
  {
    name: "KARIBUNI RESTAURANT",
    clientType: "Restaurant",
    city: "PINEL",
    contacts: [
      importedContact("Marion", "Gérante", "0690613851"),
      importedContact("Emy", "Responsable de salle", "0690707862")
    ]
  },
  { name: "EDEIS", clientType: "Aéroport", city: "GRAND CASE", contacts: [importedContact("Virginie", "Chargée de boutique", "0690221235")] },
  { name: "GO & SEA", clientType: "Bateau", city: "ANSE MARCEL", contacts: [importedContact("Franck", "Gérant", "0690665869")] },
  { name: "KALATUA WATERSPORTS", clientType: "Watersports", city: "MULLET BAY", contacts: [importedContact("Cyril", "Gérant", "0690554266")] },
  { name: "LES PETITES AIGUILLES", clientType: "Couturière", city: "MARIGOT", contacts: [importedContact("Mathilde", "Gérant", "0683922788")] },
  { name: "SUN LOCATION", clientType: "Watersports", city: "MARIGOT", contacts: [importedContact("?", "Gérant", "0690231511")] },
  { name: "A DOM CARAIBES", clientType: "Entretien", city: "HOPE ESTATE", contacts: [importedContact("Ophélie", "Gérante", "0690221221", "ophelie.e@adom-caraibes.fr")] },
  { name: "LA TERRASSE", clientType: "Restaurant", city: "MARIGOT", contacts: [importedContact("Dylan", "Gérante", "0690669999")] },
  {
    name: "CARIBBEAN LUXURY VACATION",
    clientType: "Agence Voyage",
    city: "MARIGOT",
    contacts: [
      importedContact("Muta", "femme gérant", "0786053934"),
      importedContact("Thomas", "Gérant", "0687682648")
    ]
  },
  { name: "YKB BRUNO", clientType: "Créatrice", city: "SAINT-BARTHELEMY", contacts: [importedContact("Bruno", "Gérant", "0690533358")] },
  { name: "PATES ATRA", clientType: "Restaurant", city: "HOPE ESTATE", contacts: [importedContact("Mathilde", "Gérant", "0690705106")] },
  { name: "POLO LE BOUCHER", clientType: "Restaurant", city: "HOPE ESTATE", contacts: [importedContact("Jessica", "Gérante", "0690222046")] },
  { name: "DREAM OF TRAIL", clientType: "Association", city: "-", contacts: [importedContact("Quentin", "chargé de goodies", "0690751104")] },
  { name: "KALATUA RESTAURANT", clientType: "Restaurant", city: "MULLET BAY", contacts: [importedContact("Emmanuelle", "Gérante", "0783652392")] },
  { name: "INNOVATION MEDICAL CARAIBES", clientType: "Médical", city: "-", contacts: [importedContact("?", "Gérante", "0690485844")] },
  { name: "SOLEA STUDIO", clientType: "Pole Dance", city: "?", contacts: [importedContact("Adèle", "Gérante", "0690437940")] },
  { name: "MOOD", clientType: "Restaurant", city: "HOPE ESTATE", contacts: [importedContact("Schmidt", "Gérante", "0620102980")] },
  { name: "ANNE MODE CONCEPT (KALATUA)", clientType: "Boutique", city: "MULLET BAY", contacts: [importedContact("Anne", "Gérante", "0690298858")] },
  { name: "OLDA STD", clientType: "", city: "", contacts: [] },
  { name: "DFR (BUZZ)", clientType: "Boutique", city: "HOPE ESTATE", contacts: [importedContact("Thomas", "Adjoint direction", "0690351641")] },
  { name: "OFFICE DU TOURISME", clientType: "Office du tourisme", city: "MARIGOT", contacts: [importedContact("Lou", "Responsable goodies", "0690420505")] },
  { name: "FARWOOD", clientType: "Charpentier", city: "LA SAVANE", contacts: [importedContact("Margo", "Femme du Gérant", "0690096600")] },
  { name: "SOUALIGA HOMES", clientType: "Conciergerie", city: "GRAND CASE", contacts: [importedContact("Christine", "Gérante", "0690889786")] },
  { name: "C CLIM", clientType: "Entretien", city: "-", contacts: [importedContact("Bertrand", "Gérant", "0690555018")] },
  { name: "HAPPY SCHOOL", clientType: "Ecole", city: "GRAND CASE", contacts: [importedContact("Hélène", "Responsable", "0661506224")] },
  { name: "LE RADEAU BLEU", clientType: "Watersports", city: "ANSE MARCEL", contacts: [importedContact("?", "Gérant", "0691282309")] },
  { name: "VILLA PRIVILEGE", clientType: "Conciergerie", city: "ANSE MARCEL", contacts: [importedContact("Alisson", "Gérante", "0690348899")] },
  { name: "OUALICHI GOURMET", clientType: "Boutique", city: "CUL DE SAC", contacts: [importedContact("Alain", "Gérant", "0690172732")] },
  { name: "WEST INDIES ISLANDER", clientType: "Boutique", city: "MARIGOT", contacts: [importedContact("Fred", "Gérant", "0690445588")] },
  { name: "CLEAN FOSSES", clientType: "Entretien", city: "-", contacts: [importedContact("Eric", "Gérant", "0690398812")] },
  { name: "HOTEL JM (KOHO)", clientType: "Hotel", city: "GRAND CASE", contacts: [importedContact("Mathis", "Gérant", "0622361122")] },
  { name: "JC BAR COMPANY", clientType: "Restaurant", city: "CONCORDIA", contacts: [importedContact("Jordan", "Gérant", "0690219000")] },
  { name: "LIGUE DE FOOTBALL SM", clientType: "Complexe Sportif", city: "MARIGOT", contacts: [importedContact("Ladislas", "Directeur", "0690374600")] },
  { name: "CAPTAIN JO", clientType: "Bateau", city: "ANSE MARCEL", contacts: [importedContact("Julie", "Gérante", "0690379173")] },
  { name: "GRAND CASE BEACH CLUB", clientType: "Hotel", city: "GRAND CASE", contacts: [importedContact("Alexandra", "Gérante", "0690610515")] },
  { name: "LE CARPACCIO", clientType: "Restaurant", city: "GRAND CASE", contacts: [importedContact("Kévin", "Gérant", "0690505441")] },
  { name: "100% VILLAS", clientType: "Conciergerie", city: "BAIE NETTLE", contacts: [importedContact("Vinciane", "Resp. Marketing", "0642266949")] },
  { name: "LA SAMANNA", clientType: "Hotel", city: "BAIE LONGUE", contacts: [importedContact("Eleonore", "Directrice", "12645846212")] },
  { name: "SOLUTION RESINE", clientType: "Artisan", city: "-", contacts: [importedContact("Guillaume", "Gérant", "0690297282")] },
  {
    name: "BOIS ATTITUDE",
    clientType: "Agenceur",
    city: "MONT VERNON 1",
    contacts: [
      importedContact("Basile", "Fils Gérant", "0690669424"),
      importedContact("David", "Gérant", "0690246474")
    ]
  },
  { name: "COOL SXM", clientType: "Location", city: "BAIE ORIENTALE", contacts: [importedContact("Patrick", "Gérant", "0699291969")] },
  { name: "LOVE BOAT", clientType: "Bateau", city: "ANSE MARCEL", contacts: [importedContact("Chris", "Capitaine bateau", "0690183337")] },
  { name: "TROPICAL RIDE", clientType: "Watersports", city: "BAIE ORIENTALE", contacts: [importedContact("Léa", "Gérante", "0690371349")] },
  { name: "KEN BROKER", clientType: "Agence immobilière", city: "GRAND CASE", contacts: [importedContact("Ken", "Gérant", "0690888333")] },
  { name: "CSTL", clientType: "Plombier", city: "-", contacts: [importedContact("Max", "Gérant", "0690522588")] },
  {
    name: "LE MARTIN",
    clientType: "Hotel",
    city: "CUL DE SAC",
    contacts: [
      importedContact("Marion", "Gérante", "0690565376", "info@lemartinhotel.com"),
      importedContact("Emmanuel", "Gérant", "0690358528", "info@lemartinhotel.com")
    ]
  },
  { name: "LLPM", clientType: "Conciergerie", city: "?", contacts: [importedContact("Chelsea", "Assistante Direction", "0690633449")] },
  { name: "CREOL ROCK WATERSPORTS", clientType: "Boutique", city: "GRAND CASE", contacts: [importedContact("Jérôme", "Gérant", "0690565056")] },
  { name: "CANONICA", clientType: "Boutique", city: "Aéroport Princesse Juliana", contacts: [importedContact("", "Responsable")] },
  {
    name: "BLUE MARTINI",
    clientType: "Restaurant",
    city: "GRAND CASE",
    contacts: [
      importedContact("Victor", "Gérant"),
      importedContact("Martin", "Gérant")
    ]
  },
  { name: "SOUALIGA ELEVATOR", clientType: "Artisan", city: "-", contacts: [importedContact("Benoît", "Gérant")] },
  { name: "TWENTY TWO", clientType: "Boutique", city: "-", contacts: [importedContact("Hélia", "Gérante")] },
  {
    name: "Atelier Agencement",
    clientType: "Agenceur",
    city: "HOPE ESTATE",
    contacts: [
      importedContact("Gaëtan", "Resp. Site"),
      importedContact("Gaylord", "Gérant")
    ]
  },
  { name: "LA CIGALE", clientType: "Restaurant", city: "BAIE NETTLE", contacts: [importedContact("", "", "", "restaurantlacigale@gmail.com")] },
  { name: "ARAWAK CHARTER BOAT", clientType: "Bateau", city: "ANSE MARCEL", contacts: [importedContact("", "", "0690502521", "contact@arawakcharters.com")] }
].map((client) => ({
  postalCode: "",
  createdAt: IMPORTED_CLIENT_DATE,
  ...client
}));
const TEAM_NOTE_DEFAULT_ITEMS = {
  Loic: [
    "100 % villa",
    "Jennifer Cadiso (appeler de la part de Valentines) elle s'occupe des achat cadisco 0690220275",
    "Mardi pro absent Dentiste + rdv david casquettes",
    "Projet SBH",
    "Faire test impression UV magnet OLDA",
    "Laetitia BILAN",
    "Voir beach life pour passer en facture les t-shirts en depot",
    "camera yohan",
    "Amandine Vista print",
    "Creer message type pour demande 50% acompte",
    "point charlie script",
    "Icon + Billie RDV t-shirts",
    "point toptex tarif"
  ],
  Charlie: [
    "Pancarte Atelier voir amandine",
    "Nettoyer PC melina",
    "Onduleur fournisseur",
    "Contacter TROTEC",
    "Point sur Logiciel UV"
  ],
  Melina: [
    "Mettre les nouveaux achats dans le stock sheet",
    "EBP 3+1 a rentrer",
    "Reorganiser Boutique",
    "Faire le point Loic et Charlie devis",
    "Propre Shop",
    "Casquette d'assur visio",
    "Voir stock pour toptex bateau",
    "Finir commande T-shirts Homme",
    "Faire commande T-shirts Femme"
  ],
  Amandine: [
    "video contenu The friendly books",
    "Carte cadeau 20 30 50 euros"
  ]
};

const seed = {
  teamNotes: TEAM_NOTE_MEMBERS.map((name, index) => ({
    id: index + 1,
    name,
    summary: "",
    items: [],
    updatedAt: ""
  })),
  clients: [
    {
      id: 1,
      name: "Hotel Rive Sud",
      postalCode: "97150",
      city: "Saint-Martin",
      createdAt: "2026-03-02",
      contacts: [
        { id: 1, name: "Maya Henry", role: "Direction", phone: "0690 10 02 18", email: "maya@rivesud.com" },
        { id: 2, name: "Noah Bryan", role: "Marketing", phone: "0690 90 22 14", email: "noah@rivesud.com" }
      ]
    },
    {
      id: 2,
      name: "Festival Moko",
      postalCode: "97150",
      city: "Grand Case",
      createdAt: "2026-03-04",
      contacts: [
        { id: 3, name: "Clara Joseph", role: "Production event", phone: "0690 31 77 19", email: "clara@moko.fm" }
      ]
    },
    {
      id: 3,
      name: "Maison Ledor",
      postalCode: "97150",
      city: "Marigot",
      createdAt: "2026-03-06",
      contacts: [
        { id: 4, name: "Leo Mercier", role: "Gerant", phone: "0690 55 21 44", email: "leo@ledor.st" }
      ]
    }
  ],
  dtfRequests: [
    {
      id: 1,
      clientId: 3,
      clientName: "Maison Ledor",
      dimensions: "28 x 34 cm",
      logoPlacement: "AV",
      designName: "Palm Sunset",
      size: "M",
      color: "Noir",
      technicalNote: "10/12 ans",
      quantity: 24,
      status: "draft",
      archivedAt: "",
      createdAt: "2026-03-13"
    },
    {
      id: 2,
      clientId: 2,
      clientName: "Festival Moko",
      dimensions: "32 x 40 cm",
      logoPlacement: "AV",
      designName: "Moko Crew",
      size: "XL",
      color: "Blanc",
      technicalNote: "Serie principale",
      quantity: 48,
      status: "validated",
      archivedAt: "",
      createdAt: "2026-03-12"
    },
    {
      id: 3,
      clientId: 1,
      clientName: "Hotel Rive Sud",
      dimensions: "18 x 12 cm",
      logoPlacement: "AV",
      designName: "Welcome Pack",
      size: "Unique",
      color: "Sable",
      technicalNote: "Pose poitrine",
      quantity: 12,
      status: "archived",
      archivedAt: "2026-03-10",
      createdAt: "2026-03-09"
    }
  ],
  textileOrders: [
    {
      id: 1,
      clientId: 2,
      supplier: "Toptex",
      brand: "Native Spirit",
      gender: "Mixte",
      designation: "T-shirt premium",
      catalogReference: "NS300",
      color: "Ecru",
      size: "L",
      quantity: 30,
      deliveryStatus: "maritime",
      sessionLabel: "Festival avril",
      expectedDate: "2026-03-25",
      archivedAt: "",
      createdAt: "2026-03-11"
    },
    {
      id: 2,
      clientId: 3,
      supplier: "Toptex",
      brand: "Westford Mill",
      gender: "Mixte",
      designation: "Tote bag",
      catalogReference: "WM101",
      color: "Naturel",
      size: "Unique",
      quantity: 80,
      deliveryStatus: "pending",
      sessionLabel: "Ledor mars",
      expectedDate: "2026-03-21",
      archivedAt: "",
      createdAt: "2026-03-12"
    },
    {
      id: 3,
      clientId: 1,
      supplier: "Wordans",
      brand: "Gildan",
      gender: "Mixte",
      designation: "Polo",
      catalogReference: "GD72800",
      color: "Marine",
      size: "M",
      quantity: 15,
      deliveryStatus: "received",
      sessionLabel: "Hotel staff",
      expectedDate: "2026-03-14",
      archivedAt: "",
      createdAt: "2026-03-08"
    },
  ],
  purchaseItems: DEFAULT_PURCHASE_ITEMS.map((item, index) => ({
    id: index + 1,
    zone: item.zone,
    label: item.label,
    quantity: 1,
    checked: item.checked,
    createdAt: "2026-03-17"
  })),
  productionItems: [],
  workshopTasks: DEFAULT_WORKSHOP_TASKS.map((task, index) => ({
    id: index + 1,
    group: task.group,
    label: task.label,
    checked: false,
    recurring: task.recurring,
    createdAt: "2026-03-17"
  })),
  improvementItems: [],
  testPlanningItems: []
};

const state = {
  view: "testPlanning",
  search: "",
  expandedClients: new Set(),
  selectedDtfIds: new Set(),
  showDtfArchives: false,
  showTextileArchives: false,
  textileSort: { key: "expectedDate", direction: "asc" },
  activeSheetAction: null,
  activeDtfId: null,
  activeTextileId: null,
  activePurchaseId: null,
  activeWorkshopTaskId: null,
  activeImprovementId: null,
  activeTestPlanningId: null,
  activeTestStage: null,
  activeTestAssignee: null,
  activeClientId: null,
  activeTeamNoteEdit: null,
  toastTimer: null,
  storageRecoveryMessage: ""
};

let renderQueued = false;
let pendingRender = {
  header: true,
  status: true,
  view: true,
  transition: false
};
let remoteRevision = 0;
let remoteSyncReady = false;
let remotePollingTimer = null;
let remoteSaveTimer = null;
let remoteSaveInFlight = false;
let remotePollInFlight = false;
let pendingRemoteSnapshot = null;
let lastRemoteErrorAt = 0;
let remoteBootstrapComplete = false;

const loadResult = loadDb();
let db = loadResult.data;
db.teamNotes = normalizeTeamNotes(db.teamNotes);
state.storageRecoveryMessage = loadResult.recoveryMessage;

const refs = {
  menuLinks: [...document.querySelectorAll(".menu-link")],
  pageEyebrow: document.querySelector("#pageEyebrow"),
  pageTitle: document.querySelector("#pageTitle"),
  pageIntro: document.querySelector("#pageIntro"),
  globalSearch: document.querySelector("#globalSearch"),
  primaryActionButton: document.querySelector("#primaryActionButton"),
  statusStrip: document.querySelector("#statusStrip"),
  viewRoot: document.querySelector("#viewRoot"),
  sheetDialog: document.querySelector("#sheetDialog"),
  sheetForm: document.querySelector("#sheetForm"),
  sheetEyebrow: document.querySelector("#sheetEyebrow"),
  sheetTitle: document.querySelector("#sheetTitle"),
  sheetBody: document.querySelector("#sheetBody"),
  submitSheetButton: document.querySelector("#submitSheetButton"),
  closeSheetButton: document.querySelector("#closeSheetButton"),
  cancelSheetButton: document.querySelector("#cancelSheetButton"),
  toast: document.querySelector("#toast")
};
const SPELLCHECK_SENTENCE_FIELDS = new Set([
  "label",
  "note",
  "technicalNote",
  "team-note-summary",
  "team-note-edit-label",
  "search"
]);
const SPELLCHECK_WORD_FIELDS = new Set([
  "name",
  "city",
  "contact",
  "contactName",
  "contactRole",
  "designation",
  "sessionLabel"
]);

init();

function init() {
  bindGlobalErrorHandlers();
  bindEvents();
  syncProofingFields(document);
  requestRender();
  void startRemoteSync();

  if (state.storageRecoveryMessage) {
    showToast(state.storageRecoveryMessage);
  }
}

async function startRemoteSync() {
  try {
    const response = await fetchRemoteDb();

    if (response.status === 404) {
      remoteSyncReady = true;
      startRemotePolling();
      remoteBootstrapComplete = true;
      scheduleRemoteSave({ immediate: true });
      return;
    }

    if (!response.ok) {
      throw new Error(`Remote sync failed with status ${response.status}`);
    }

    const record = await response.json();
    if (shouldBootstrapServerFromLocal(record)) {
      remoteSyncReady = true;
      startRemotePolling();
      remoteBootstrapComplete = true;
      scheduleRemoteSave({ immediate: true });
      showToast("La base locale a ete reappliquee sur le serveur.");
      return;
    }

    applyRemoteDbRecord(record);
    remoteSyncReady = true;
    startRemotePolling();
    remoteBootstrapComplete = true;
  } catch (error) {
    console.error(error);
    notifyRemoteSyncIssue();
    window.setTimeout(() => {
      void startRemoteSync();
    }, REMOTE_SYNC_INTERVAL_MS);
  }
}

function shouldBootstrapServerFromLocal(record) {
  if (remoteBootstrapComplete) {
    return false;
  }

  if (loadResult.source === "seed") {
    return false;
  }

  if (Number(record?.revision) > 1) {
    return false;
  }

  const remoteData = record?.data;
  if (!remoteData || typeof remoteData !== "object") {
    return false;
  }

  return dbContentScore(db) > dbContentScore(normalizeDb(remoteData));
}

function dbContentScore(sourceDb) {
  if (!sourceDb || typeof sourceDb !== "object") {
    return 0;
  }

  let score = 0;
  score += Array.isArray(sourceDb.clients) ? sourceDb.clients.length * 3 : 0;
  score += Array.isArray(sourceDb.dtfRequests) ? sourceDb.dtfRequests.length * 4 : 0;
  score += Array.isArray(sourceDb.textileOrders) ? sourceDb.textileOrders.length * 4 : 0;
  score += Array.isArray(sourceDb.purchaseItems) ? sourceDb.purchaseItems.length : 0;
  score += Array.isArray(sourceDb.productionItems) ? sourceDb.productionItems.length * 2 : 0;
  score += Array.isArray(sourceDb.workshopTasks) ? sourceDb.workshopTasks.length : 0;
  score += Array.isArray(sourceDb.improvementItems) ? sourceDb.improvementItems.length : 0;
  score += Array.isArray(sourceDb.testPlanningItems) ? sourceDb.testPlanningItems.length * 4 : 0;
  score += Array.isArray(sourceDb.teamNotes)
    ? sourceDb.teamNotes.reduce((total, note) => total + (Array.isArray(note?.items) ? note.items.length : 0), 0)
    : 0;
  return score;
}

function startRemotePolling() {
  if (remotePollingTimer) {
    clearInterval(remotePollingTimer);
  }

  remotePollingTimer = window.setInterval(() => {
    void pollRemoteDb();
  }, REMOTE_SYNC_INTERVAL_MS);

  document.removeEventListener("visibilitychange", handleRemoteVisibilityChange);
  document.addEventListener("visibilitychange", handleRemoteVisibilityChange);
}

var remotePollingPaused = false;

function pauseRemotePolling() {
  remotePollingPaused = true;
  if (remotePollingTimer) {
    clearInterval(remotePollingTimer);
    remotePollingTimer = null;
  }
  document.removeEventListener("visibilitychange", handleRemoteVisibilityChange);
}

function resumeRemotePolling() {
  remotePollingPaused = false;
  startRemotePolling();
  void pollRemoteDb();
}

function handleRemoteVisibilityChange() {
  if (!document.hidden) {
    void pollRemoteDb();
  }
}

async function pollRemoteDb() {
  if (!remoteSyncReady || remoteSaveInFlight || remotePollInFlight) {
    return;
  }

  remotePollInFlight = true;
  try {
    const response = await fetchRemoteDb(remoteRevision);
    if (response.status === 204 || response.status === 404) {
      return;
    }

    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }

    if (!response.ok) {
      throw new Error(`Remote poll failed with status ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      window.location.href = "/login";
      return;
    }

    const record = await response.json();
    applyRemoteDbRecord(record, { announce: true });
  } catch (error) {
    if (error instanceof TypeError || error instanceof SyntaxError) {
      return;
    }
    console.error(error);
    notifyRemoteSyncIssue();
  } finally {
    remotePollInFlight = false;
  }
}

function notifyRemoteSyncIssue() {
  const now = Date.now();
  if (now - lastRemoteErrorAt < 15000) {
    return;
  }

  lastRemoteErrorAt = now;
  showToast("Synchronisation serveur indisponible. Verifie la connexion.");
}

function fetchRemoteDb(revision = null) {
  const url = revision
    ? `${SERVER_DB_ENDPOINT}?revision=${encodeURIComponent(revision)}`
    : SERVER_DB_ENDPOINT;

  return fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });
}

function applyRemoteDbRecord(record, options = {}) {
  if (!record?.data || typeof record.data !== "object") {
    return;
  }

  remoteRevision = Math.max(0, Number(record.revision) || 0);
  const localSnapshotBeforeOverwrite = pendingRemoteSnapshot ? buildDbSnapshot() : null;
  db = normalizeDb(record.data);
  db.teamNotes = normalizeTeamNotes(db.teamNotes);
  if (localSnapshotBeforeOverwrite) {
    mergeLocalChangesBack(localSnapshotBeforeOverwrite);
  }

  const normalizedPayload = JSON.stringify(buildDbSnapshot());
  const incomingPayload = JSON.stringify({
    ...record.data,
    _meta: {
      version: DATA_VERSION
    }
  });
  persistDb({ skipRemote: normalizedPayload === incomingPayload });

  requestRender();

  if (options.announce) {
    if (importedOrdersAdded || duplicateOrdersRemoved) {
      // silent – no toast for background sync
    }
  }
}

function bindGlobalErrorHandlers() {
  window.addEventListener("error", (event) => {
    handleFatalUiError(event.error || new Error(event.message || "Erreur interface"));
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleFatalUiError(event.reason || new Error("Promesse non geree"));
  });
}

function handleFatalUiError(error) {
  console.error(error);

  const message = "Une erreur critique est survenue. Recharge la page.";
  refs.statusStrip.hidden = true;
  refs.statusStrip.innerHTML = "";
  refs.viewRoot.innerHTML = `
    <section class="module-layout">
      <article class="placeholder-card">
        <p class="module-kicker">Erreur</p>
        <strong>Le module a rencontre un probleme.</strong>
        <p>${escapeHtml(message)}</p>
      </article>
    </section>
  `;
  showToast(message);
}

function bindEvents() {
  refs.menuLinks.forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      state.search = "";
      state.selectedDtfIds.clear();
      state.selectedOrderId = null;
      state.orderAssigneeFilter = "";
      state.orderZoneFilter = "";
      state.showOrderArchives = false;
      refs.globalSearch.value = "";
      requestRender({ transition: true });
    });
  });

  refs.globalSearch.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    requestRender({ header: false, status: true, view: true });
  });

  refs.primaryActionButton.addEventListener("click", () => {
    if (!views[state.view].primaryAction) {
      return;
    }

    openSheet(views[state.view].primaryAction);
  });

  refs.closeSheetButton.addEventListener("click", closeSheet);
  refs.cancelSheetButton.addEventListener("click", closeSheet);
  refs.sheetForm.addEventListener("submit", handleSheetSubmit);
  refs.sheetForm.addEventListener("input", handleSheetDraftInput);
  refs.sheetForm.addEventListener("change", handleSheetDraftInput);
  refs.sheetForm.addEventListener("click", function(event) {
    var target = event.target;
    var actionNode = target.closest("[data-action]");
    if (!actionNode) return;
  });

  refs.viewRoot.addEventListener("click", handleRootClick);
  refs.viewRoot.addEventListener("input", handleRootInput);
  refs.viewRoot.addEventListener("dblclick", handleRootDoubleClick);
  refs.viewRoot.addEventListener("keydown", handleRootKeyDown);
  refs.viewRoot.addEventListener("change", handleRootChange);
  refs.viewRoot.addEventListener("submit", handleRootSubmit);
  refs.viewRoot.addEventListener("focusout", function(e) {
    if (e.target && e.target.dataset && e.target.dataset.inlineStatusSel) {
      handleInlineStatusEvent(e.target);
    }
  });
}

function handleRootClick(event) {
  const target = event.target;
  const actionNode = target.closest("[data-action]");

  if (actionNode) {
    const { action } = actionNode.dataset;
    const id = Number(actionNode.dataset.id);

    if (action === "toggle-client") {
      if (state.expandedClients.has(id)) {
        state.expandedClients.delete(id);
      } else {
        state.expandedClients.add(id);
      }
      requestRender({ header: false, status: false, view: true });
      return;
    }

    if (action === "toggle-team-note-item") {
      const noteId = Number(actionNode.dataset.noteId);
      const itemId = Number(actionNode.dataset.itemId);
      const note = db.teamNotes.find((item) => item.id === noteId);
      const entry = note?.items.find((item) => item.id === itemId);
      if (!entry) {
        return;
      }

      entry.checked = !entry.checked;
      note.updatedAt = isoToday();
      persistDb();
      requestRender({ header: false, status: true, view: true });
      return;
    }

    if (action === "delete-team-note-item") {
      const noteId = Number(actionNode.dataset.noteId);
      const itemId = Number(actionNode.dataset.itemId);
      const note = db.teamNotes.find((item) => item.id === noteId);
      if (!note) {
        return;
      }

      note.items = note.items.filter((item) => item.id !== itemId);
      if (state.activeTeamNoteEdit === teamNoteEditKey(noteId, itemId)) {
        state.activeTeamNoteEdit = null;
      }
      note.updatedAt = isoToday();
      persistDb();
      requestRender({ header: false, status: true, view: true });
      return;
    }

    if (action === "edit-team-note-item") {
      const noteId = Number(actionNode.dataset.noteId);
      const itemId = Number(actionNode.dataset.itemId);
      startEditingTeamNoteItem(noteId, itemId);
      return;
    }

    if (action === "toggle-dtf-archives") {
      state.showDtfArchives = !state.showDtfArchives;
      state.selectedDtfIds.clear();
      requestRender({ transition: true });
      return;
    }

    if (action === "toggle-textile-archives") {
      state.showTextileArchives = !state.showTextileArchives;
      requestRender({ transition: true });
      return;
    }

    if (action === "complete-test-planning-mockup") {
      const tpItem = db.testPlanningItems.find((item) => item.id === id);
      if (!tpItem) {
        return;
      }

      tpItem.mockupCompletedAt = isoNow();
      persistDb();
      requestRender({ header: false, status: true, view: true });
      showToast("Maquette terminée.");
      return;
    }

    if (action === "complete-dtf-mockup") {
      const dtf = db.dtfRequests.find((item) => item.id === id);
      if (!dtf) {
        return;
      }

      dtf.needsMockup = false;
      dtf.mockupCompletedAt = isoNow();
      persistDb();
      requestRender({ header: false, status: true, view: true });
      showToast("Maquette DTF terminee.");
      return;
    }

    if (action === "duplicate-dtf") {
      duplicateDtfItems([...state.selectedDtfIds]);
      return;
    }

    if (action === "validate-dtf") {
      updateDtfStatus([...state.selectedDtfIds], "validated");
      return;
    }

    if (action === "archive-dtf") {
      archiveDtfItems([...state.selectedDtfIds], !state.showDtfArchives);
      return;
    }

    if (action === "delete-dtf") {
      deleteDtfItems([...state.selectedDtfIds]);
      return;
    }

    if (action === "delete-single-dtf") {
      deleteDtfItems([id]);
      return;
    }

    if (action === "archive-single-dtf") {
      archiveDtfItems([id], true);
      return;
    }

    if (action === "restore-single-dtf") {
      archiveDtfItems([id], false);
      return;
    }

    if (action === "sort-textile") {
      toggleTextileSort(actionNode.dataset.key);
      requestRender({ header: false, status: false, view: true });
      return;
    }

    if (action === "archive-textile") {
      archiveTextileOrder(id, true);
      return;
    }

    if (action === "restore-textile") {
      archiveTextileOrder(id, false);
      return;
    }

    if (action === "delete-textile") {
      db.textileOrders = db.textileOrders.filter((item) => item.id !== id);
      persistDb();
      requestRender({ header: false, status: true, view: true });
      showToast("Commande textile supprimee.");
      return;
    }

    if (action === "delete-purchase") {
      const item = db.purchaseItems.find((item) => item.id === id);
      if (item) {
        item.deletedAt = new Date().toISOString();
      }
      persistDb();
      requestRender();
      showToast("Article supprime.");
      return;
    }

    if (action === "delete-task") {
      db.workshopTasks = db.workshopTasks.filter((item) => item.id !== id);
      persistDb();
      requestRender();
      showToast("Tache supprimee.");
      return;
    }

    if (action === "delete-improvement") {
      db.improvementItems = db.improvementItems.filter((item) => item.id !== id);
      persistDb();
      requestRender();
      showToast("Remontee supprimee.");
      return;
    }

    if (action === "delete-test-planning") {
      db.testPlanningItems = db.testPlanningItems.filter((item) => item.id !== id);
      persistDb();
      requestRender({ header: false, status: false, view: true });
      showToast("Ligne test planning supprimée.");
      return;
    }

    if (action === "test-planning-next-stage" || action === "test-planning-prev-stage") {
      const item = db.testPlanningItems.find((entry) => entry.id === id);
      if (!item) {
        return;
      }

      const currentIndex = TEST_PLANNING_STAGE_KEYS.indexOf(item.stage);
      if (currentIndex === -1) {
        return;
      }

      const nextIndex = action === "test-planning-next-stage" ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0 || nextIndex >= TEST_PLANNING_STAGE_KEYS.length) {
        return;
      }

      item.stage = TEST_PLANNING_STAGE_KEYS[nextIndex];
      item.status = testPlanningDefaultStatus(item.stage);
      persistDb();
      requestRender({ header: false, status: false, view: true });
      return;
    }

    if (action === "increase-production-quantity") {
      const item = db.productionItems.find((entry) => entry.id === id);
      if (!item) {
        return;
      }

      item.prints.push({
        id: nextId(item.prints),
        checked: false
      });
      item.updatedAt = isoNow();
      persistDb();
      requestRender({ header: false, status: true, view: true });
      return;
    }

    if (action === "decrease-production-quantity") {
      const item = db.productionItems.find((entry) => entry.id === id);
      if (!item) {
        return;
      }

      if (item.prints.length <= 1) {
        return;
      }

      const removable = [...item.prints].reverse().find((print) => !print.checked) ?? item.prints[item.prints.length - 1];
      item.prints = item.prints.filter((print) => print.id !== removable.id);
      item.updatedAt = isoNow();
      persistDb();
      requestRender({ header: false, status: true, view: true });
      return;
    }

    if (action === "duplicate-production-item") {
      const source = db.productionItems.find((item) => item.id === id);
      if (source) {
        const clone = {
          ...source,
          id: nextId(db.productionItems),
          status: PRODUCTION_STATUS_DEFAULT,
          errorNote: "",
          prints: source.prints.map((p, i) => ({ id: i + 1, checked: false })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.productionItems.unshift(clone);
        persistDb();
        requestRender({ header: false, status: true, view: true });
        showToast("PRT duplique.");
      }
      return;
    }

    if (action === "delete-production-item") {
      db.productionItems = db.productionItems.filter((item) => item.id !== id);
      persistDb();
      requestRender({ header: false, status: true, view: true });
      showToast("Ligne production supprimee.");
      return;
    }

  }

  const stageJumpNode = target.closest("[data-test-stage-jump]");
  if (stageJumpNode) {
    var stageJump = stageJumpNode.dataset.testStageJump;
    if (stageJump === "__recent__") {
      state.activeTestStage = null;
    } else {
      state.activeTestStage = state.activeTestStage === stageJump ? null : stageJump;
    }
    requestRender({ header: false, status: false, view: true });
    return;
  }

  const assigneeFilterNode = target.closest("[data-test-assignee-filter]");
  if (assigneeFilterNode) {
    const assignee = assigneeFilterNode.dataset.testAssigneeFilter;
    state.activeTestAssignee = state.activeTestAssignee === assignee ? null : assignee;
    requestRender({ header: false, status: false, view: true });
    return;
  }

  var inlineStatusNode = target.closest("[data-inline-status]");
  if (inlineStatusNode && inlineStatusNode.tagName === "SPAN") {
    var selId = inlineStatusNode.dataset.inlineStatus;
    var selEl = document.querySelector('[data-inline-status-sel="' + selId + '"]');
    if (selEl) {
      inlineStatusNode.classList.add("is-hidden");
      selEl.classList.remove("is-hidden");
      selEl.focus();
    }
    return;
  }

  if (!["planning", "testPlanning", "clients", "dtf", "textile", "purchase", "workshop", "improvements"].includes(state.view)) {
    return;
  }

  const interactiveNode = target.closest("button, input, select, textarea, a, label");
  if (interactiveNode) {
    return;
  }

  if (state.view === "clients") {
    const row = target.closest("[data-client-id]");
    if (!row) {
      return;
    }

    openSheet("editClient", { id: Number(row.dataset.clientId) });
    return;
  }

  if (state.view === "testPlanning") {
    if (target.closest("[data-inline-status]")) return;
    const row = target.closest("[data-test-planning-id]");
    if (!row) {
      return;
    }

    openSheet("editTestPlanningOrder", { id: Number(row.dataset.testPlanningId) });
    return;
  }

  if (state.view === "textile") {
    const row = target.closest("[data-textile-id]");
    if (!row) {
      return;
    }

    openSheet("editTextileOrder", { id: Number(row.dataset.textileId) });
    return;
  }

  if (state.view === "purchase") {
    const row = target.closest("[data-purchase-id]");
    if (!row) {
      return;
    }

    openSheet("editPurchaseItem", { id: Number(row.dataset.purchaseId) });
    return;
  }

  if (state.view === "workshop") {
    const row = target.closest("[data-workshop-task-id]");
    if (!row) {
      return;
    }

    openSheet("editWorkshopTask", { id: Number(row.dataset.workshopTaskId) });
    return;
  }

  if (state.view === "improvements") {
    const row = target.closest("[data-improvement-id]");
    if (!row) {
      return;
    }

    openSheet("editImprovementItem", { id: Number(row.dataset.improvementId) });
    return;
  }

  const row = target.closest("[data-dtf-id]");
  if (!row) {
    return;
  }

  openSheet("editDtf", { id: Number(row.dataset.dtfId) });
}

function handleRootDoubleClick(event) {
  if (!["planning", "testPlanning", "clients", "dtf", "textile", "purchase", "workshop", "improvements"].includes(state.view)) {
    return;
  }

  if (event.target.closest("[data-inline-status]")) return;

  const interactiveNode = event.target.closest("button, input, select, textarea, a, label");
  if (interactiveNode) {
    return;
  }

  if (state.view === "clients") {
    const row = event.target.closest("[data-client-id]");
    if (!row) {
      return;
    }

    openSheet("editClient", { id: Number(row.dataset.clientId) });
    return;
  }

  if (state.view === "testPlanning") {
    const row = event.target.closest("[data-test-planning-id]");
    if (!row) {
      return;
    }

    openSheet("editTestPlanningOrder", { id: Number(row.dataset.testPlanningId) });
    return;
  }

  if (state.view === "textile") {
    const row = event.target.closest("[data-textile-id]");
    if (!row) {
      return;
    }

    openSheet("editTextileOrder", { id: Number(row.dataset.textileId) });
    return;
  }

  if (state.view === "purchase") {
    const row = event.target.closest("[data-purchase-id]");
    if (!row) {
      return;
    }

    openSheet("editPurchaseItem", { id: Number(row.dataset.purchaseId) });
    return;
  }

  if (state.view === "workshop") {
    const row = event.target.closest("[data-workshop-task-id]");
    if (!row) {
      return;
    }

    openSheet("editWorkshopTask", { id: Number(row.dataset.workshopTaskId) });
    return;
  }

  if (state.view === "improvements") {
    const row = event.target.closest("[data-improvement-id]");
    if (!row) {
      return;
    }

    openSheet("editImprovementItem", { id: Number(row.dataset.improvementId) });
    return;
  }

  const row = event.target.closest("[data-dtf-id]");
  if (!row) {
    return;
  }

  openSheet("editDtf", { id: Number(row.dataset.dtfId) });
}

function handleRootKeyDown(event) {
  if (event.key !== "Enter" || !["planning", "testPlanning", "clients", "textile", "purchase", "workshop", "improvements"].includes(state.view)) {
    return;
  }

  event.preventDefault();

  if (state.view === "clients") {
    const row = event.target.closest("[data-client-id]");
    if (!row) {
      return;
    }

    openSheet("editClient", { id: Number(row.dataset.clientId) });
    return;
  }

  if (state.view === "testPlanning") {
    const row = event.target.closest("[data-test-planning-id]");
    if (!row) {
      return;
    }

    openSheet("editTestPlanningOrder", { id: Number(row.dataset.testPlanningId) });
    return;
  }

  if (state.view === "textile") {
    const row = event.target.closest("[data-textile-id]");
    if (!row) {
      return;
    }

    openSheet("editTextileOrder", { id: Number(row.dataset.textileId) });
    return;
  }

  if (state.view === "purchase") {
    const row = event.target.closest("[data-purchase-id]");
    if (!row) {
      return;
    }

    openSheet("editPurchaseItem", { id: Number(row.dataset.purchaseId) });
    return;
  }

  if (state.view === "workshop") {
    const row = event.target.closest("[data-workshop-task-id]");
    if (!row) {
      return;
    }

    openSheet("editWorkshopTask", { id: Number(row.dataset.workshopTaskId) });
    return;
  }

  const row = event.target.closest("[data-improvement-id]");
  if (!row) {
    return;
  }

  openSheet("editImprovementItem", { id: Number(row.dataset.improvementId) });
}

function handleRootInput(event) {
  const target = event.target;

  if (target.name === "team-note-edit-label") {
    autosizeTextarea(target);
    syncTeamNoteItemInput(
      Number(target.dataset.noteId),
      Number(target.dataset.itemId),
      String(target.value ?? "")
    );
  }

  if (target.name === "team-note-summary") {
    autosizeTextarea(target);
    syncTeamNoteSummary(
      Number(target.dataset.noteId),
      String(target.value ?? "")
    );
  }
}

function handleSheetDraftInput(event) {
  const target = event?.target;

  if (target?.name === "designPreset") {
    const presetValue = String(target.value ?? "").trim();
    const designInput = refs.sheetForm.elements.namedItem("designName");
    if (designInput instanceof HTMLInputElement) {
      designInput.value = presetValue;
    }
  }

  if (target?.name === "stage" && target instanceof HTMLSelectElement && (state.activeSheetAction === "addTestPlanningOrder" || state.activeSheetAction === "editTestPlanningOrder")) {
    var statusField = refs.sheetForm?.elements.namedItem("status");
    if (statusField instanceof HTMLSelectElement) {
      statusField.value = testPlanningDefaultStatus(target.value);
    }
    syncTestPlanningStageField();
  }

  if (target?.name === "status" && target instanceof HTMLSelectElement && (state.activeSheetAction === "editTestPlanningOrder" || state.activeSheetAction === "addTestPlanningOrder")) {
    var newStatus = target.value;
    var targetStage = testPlanningStageForStatus(newStatus);
    if (targetStage) {
      var stageField = refs.sheetForm?.elements.namedItem("stage");
      if (stageField instanceof HTMLSelectElement && stageField.value !== targetStage) {
        stageField.value = targetStage;
        syncTestPlanningStageField();
      }
    }
  }

  if (target?.name === "needsMockup") {
    syncTestPlanningMockupField();
  }

  persistSheetDraft();
}

function handleRootChange(event) {
  const target = event.target;

  if (target.dataset && target.dataset.inlineStatusSel) {
    handleInlineStatusEvent(target);
    return;
  }

  if (target.name === "team-note-edit-label") {
    saveTeamNoteItem(
      Number(target.dataset.noteId),
      Number(target.dataset.itemId),
      String(target.value ?? "")
    );
    return;
  }

  if (target.name === "dtf-select") {
    const id = Number(target.value);
    if (target.checked) {
      state.selectedDtfIds.add(id);
    } else {
      state.selectedDtfIds.delete(id);
    }
    requestRender({ header: false, status: true, view: true });
    return;
  }

  if (target.name === "dtf-select-all") {
    state.selectedDtfIds.clear();
    getVisibleDtfItems().forEach((item) => {
      if (target.checked) {
        state.selectedDtfIds.add(item.id);
      }
    });
    requestRender({ header: false, status: true, view: true });
    return;
  }

  if (target.name === "purchase-checked") {
    const id = Number(target.value);
    const item = db.purchaseItems.find((entry) => entry.id === id);
    if (item) {
      item.checked = target.checked;
      persistDb();
      requestRender({ header: false, status: true, view: false });
    }
    return;
  }


  if (target.name === "task-checked") {
    const id = Number(target.value);
    const item = db.workshopTasks.find((entry) => entry.id === id);
    if (item) {
      item.checked = target.checked;
      persistDb();
      requestRender({ header: false, status: true, view: false });
    }
    return;
  }

  if (target.name === "production-status") {
    const id = Number(target.dataset.id);
    const item = db.productionItems.find((entry) => entry.id === id);
    if (item) {
      item.status = normalizeProductionStatus(target.value);
      item.updatedAt = isoNow();
      persistDb();
      requestRender({ header: false, status: true, view: true });
    }
    return;
  }

  if (target.name === "production-error") {
    const id = Number(target.dataset.id);
    const item = db.productionItems.find((entry) => entry.id === id);
    if (item) {
      item.errorNote = String(target.value ?? "").trim();
      item.updatedAt = isoNow();
      persistDb();
      requestRender({ header: false, status: false, view: false });
    }
    return;
  }

  if (target.name === "production-print-checked") {
    const itemId = Number(target.dataset.id);
    const printId = Number(target.value);
    const item = db.productionItems.find((entry) => entry.id === itemId);
    const print = item?.prints.find((entry) => entry.id === printId);
    if (print) {
      print.checked = target.checked;
      item.updatedAt = isoNow();
      persistDb();
      requestRender({ header: false, status: true, view: false });
    }
  }
}

function handleRootSubmit(event) {
  const form = event.target;

  if (form.dataset.form === "team-note-add") {
    event.preventDefault();
    const formData = new FormData(form);
    const noteId = Number(formData.get("noteId"));
    const label = String(formData.get("label") ?? "").trim();

    if (!label) {
      return;
    }

    const note = db.teamNotes.find((item) => item.id === noteId);
    if (!note) {
      return;
    }

    note.items.unshift({
      id: nextId(note.items),
      label,
      checked: false
    });
    note.updatedAt = isoToday();
    persistDb();
    form.reset();
    requestRender({ header: false, status: true, view: true });
    return;
  }

  if (form.dataset.form === "team-note-edit") {
    event.preventDefault();
    const formData = new FormData(form);
    saveTeamNoteItem(
      Number(formData.get("noteId")),
      Number(formData.get("itemId")),
      String(formData.get("team-note-edit-label") ?? "")
    );
    return;
  }

  if (form.dataset.form === "purchase-quick-add") {
    event.preventDefault();
    const formData = new FormData(form);
    const zone = String(formData.get("zone"));
    const label = String(formData.get("label") ?? "").trim();

    if (!label) {
      return;
    }

    db.purchaseItems.unshift({
      id: nextId(db.purchaseItems),
      zone,
      label,
      quantity: 1,
      checked: false,
      createdAt: isoToday()
    });
    persistDb();
    form.reset();
    requestRender();
    showToast("Article ajoute.");
    return;
  }

  if (form.dataset.form === "task-quick-add") {
    event.preventDefault();
    const formData = new FormData(form);
    const group = String(formData.get("group"));
    const label = String(formData.get("label") ?? "").trim();

    if (!label) {
      return;
    }

    db.workshopTasks.unshift({
      id: nextId(db.workshopTasks),
      group,
      label,
      checked: false,
      recurring: false,
      createdAt: isoToday()
    });
    persistDb();
    form.reset();
    requestRender();
    showToast("Tache ajoutee.");
    return;
  }

  if (form.dataset.form === "improvement-quick-add") {
    event.preventDefault();
    const formData = new FormData(form);
    const type = String(formData.get("type") ?? "bug");
    const label = String(formData.get("label") ?? "").trim();

    if (!label) {
      return;
    }

    db.improvementItems.unshift({
      id: nextId(db.improvementItems),
      type,
      label,
      createdAt: isoToday()
    });
    persistDb();
    form.reset();
    requestRender();
    showToast("Remontee ajoutee.");
    return;
  }
}

function handleSheetSubmit(event) {
  event.preventDefault();
  const formData = new FormData(refs.sheetForm);

  if (state.activeSheetAction === "addClient") {
    const client = {
      id: nextId(db.clients),
      name: String(formData.get("name") ?? "").trim(),
      postalCode: String(formData.get("postalCode") ?? "").trim(),
      city: String(formData.get("city") ?? "").trim(),
      createdAt: isoToday(),
      contacts: [
        {
          id: 1,
          name: String(formData.get("contactName") ?? "").trim(),
          role: String(formData.get("contactRole") ?? "").trim(),
          phone: String(formData.get("contactPhone") ?? "").trim(),
          email: String(formData.get("contactEmail") ?? "").trim()
        }
      ].filter((contact) => contact.name)
    };

    db.clients.unshift(client);
    persistDb();
    clearSheetDraftByAction("addClient");
    closeSheet();
    requestRender({ transition: true });
    showToast("Client ajoute.");
    return;
  }

  if (state.activeSheetAction === "editClient") {
    const client = db.clients.find((item) => item.id === state.activeClientId);
    if (!client) {
      closeSheet();
      showToast("Client introuvable.");
      return;
    }

    const primaryContact = primaryClientContact(client);
    client.name = String(formData.get("name") ?? "").trim();
    client.postalCode = String(formData.get("postalCode") ?? "").trim();
    client.city = String(formData.get("city") ?? "").trim();

    const contactName = String(formData.get("contactName") ?? "").trim();
    const contact = {
      id: primaryContact.id || 1,
      name: contactName,
      role: String(formData.get("contactRole") ?? "").trim(),
      phone: String(formData.get("contactPhone") ?? "").trim(),
      email: String(formData.get("contactEmail") ?? "").trim()
    };
    client.contacts = contactName ? [contact] : [];

    persistDb();
    clearSheetDraftByAction("editClient", client.id);
    closeSheet();
    requestRender({ transition: true });
    showToast("Client mis a jour.");
    return;
  }

  if (state.activeSheetAction === "addDtf") {
    const client = parseOrderClient(formData.get("clientName"));
    db.dtfRequests.unshift({
      id: nextId(db.dtfRequests),
      clientId: client.clientId,
      clientName: client.clientName,
      dimensions: String(formData.get("dimensions") ?? "").trim(),
      logoPlacement: inferLogoPlacement(formData.get("designName")),
      designName: String(formData.get("designName") ?? "").trim(),
      size: String(formData.get("size") ?? "").trim(),
      color: String(formData.get("color") ?? "").trim(),
      technicalNote: String(formData.get("technicalNote") ?? "").trim(),
      quantity: Math.max(1, Number(formData.get("quantity") ?? 1) || 1),
      needsMockup: formData.get("needsMockup") === "on",
      clientType: String(formData.get("clientType") ?? "perso"),
      mockupCompletedAt: "",
      status: "draft",
      archivedAt: "",
      createdAt: isoToday()
    });
    persistDb();
    clearSheetDraftByAction("addDtf");
    closeSheet();
    requestRender({ transition: true });
    showToast("Demande DTF ajoutee.");
    return;
  }

  if (state.activeSheetAction === "editDtf") {
    const dtf = db.dtfRequests.find((item) => item.id === state.activeDtfId);
    if (!dtf) {
      return;
    }

    const client = parseOrderClient(formData.get("clientName"));
    dtf.clientId = client.clientId;
    dtf.clientName = client.clientName;
    dtf.dimensions = String(formData.get("dimensions") ?? "").trim();
    dtf.logoPlacement = inferLogoPlacement(formData.get("designName"), dtf.logoPlacement);
    dtf.designName = String(formData.get("designName") ?? "").trim();
    dtf.size = String(formData.get("size") ?? "").trim();
    dtf.color = String(formData.get("color") ?? "").trim();
    dtf.technicalNote = String(formData.get("technicalNote") ?? "").trim();
    dtf.quantity = Math.max(1, Number(formData.get("quantity") ?? 1) || 1);
    dtf.needsMockup = formData.get("needsMockup") === "on";
    dtf.clientType = String(formData.get("clientType") ?? "perso");
    dtf.mockupCompletedAt = dtf.needsMockup ? "" : String(dtf.mockupCompletedAt ?? "");
    persistDb();
    clearSheetDraftByAction("editDtf", dtf.id);
    closeSheet();
    requestRender({ transition: true });
    showToast("Demande DTF mise a jour.");
    return;
  }

  if (state.activeSheetAction === "addTextileOrder") {
    const client = parseOrderClient(formData.get("clientName"));
    db.textileOrders.unshift({
      id: nextId(db.textileOrders),
      clientId: client.clientId,
      clientName: client.clientName,
      supplier: String(formData.get("supplier") ?? "").trim(),
      brand: String(formData.get("brand") ?? "").trim(),
      gender: String(formData.get("gender") ?? "").trim(),
      designation: String(formData.get("designation") ?? "").trim(),
      catalogReference: String(formData.get("catalogReference") ?? "").trim(),
      color: String(formData.get("color") ?? "").trim(),
      size: String(formData.get("size") ?? "").trim(),
      quantity: Math.max(1, Number(formData.get("quantity") ?? 1) || 1),
      deliveryStatus: String(formData.get("deliveryStatus") ?? "pending"),
      sessionLabel: String(formData.get("sessionLabel") ?? "").trim(),
      expectedDate: String(formData.get("expectedDate") ?? isoToday()),
      archivedAt: "",
      createdAt: isoToday()
    });
    persistDb();
    clearSheetDraftByAction("addTextileOrder");
    closeSheet();
    requestRender({ transition: true });
    showToast("Commande textile ajoutee.");
    return;
  }

  if (state.activeSheetAction === "editTextileOrder") {
    const textileOrder = db.textileOrders.find((item) => item.id === state.activeTextileId);
    if (!textileOrder) {
      closeSheet();
      showToast("Commande textile introuvable.");
      return;
    }

    const client = parseOrderClient(formData.get("clientName"));
    textileOrder.clientId = client.clientId;
    textileOrder.clientName = client.clientName;
    textileOrder.supplier = String(formData.get("supplier") ?? "").trim();
    textileOrder.brand = String(formData.get("brand") ?? "").trim();
    textileOrder.gender = String(formData.get("gender") ?? "").trim();
    textileOrder.designation = String(formData.get("designation") ?? "").trim();
    textileOrder.catalogReference = String(formData.get("catalogReference") ?? "").trim();
    textileOrder.color = String(formData.get("color") ?? "").trim();
    textileOrder.size = String(formData.get("size") ?? "").trim();
    textileOrder.quantity = Math.max(1, Number(formData.get("quantity") ?? 1) || 1);
    textileOrder.deliveryStatus = String(formData.get("deliveryStatus") ?? "pending");
    textileOrder.sessionLabel = String(formData.get("sessionLabel") ?? "").trim();
    textileOrder.expectedDate = String(formData.get("expectedDate") ?? isoToday());
    persistDb();
    clearSheetDraftByAction("editTextileOrder", textileOrder.id);
    closeSheet();
    requestRender({ transition: true });
    showToast("Commande textile mise a jour.");
    return;
  }

  if (state.activeSheetAction === "editPurchaseItem") {
    const purchaseItem = db.purchaseItems.find((item) => item.id === state.activePurchaseId);
    if (!purchaseItem) {
      closeSheet();
      showToast("Article introuvable.");
      return;
    }

    purchaseItem.zone = String(formData.get("zone") ?? "SXM");
    purchaseItem.label = String(formData.get("label") ?? "").trim();
    purchaseItem.quantity = Math.max(1, Number(formData.get("quantity") ?? 1) || 1);
    persistDb();
    clearSheetDraftByAction("editPurchaseItem", purchaseItem.id);
    closeSheet();
    requestRender({ transition: true });
    showToast("Article mis a jour.");
    return;
  }

  if (state.activeSheetAction === "editWorkshopTask") {
    const workshopTask = db.workshopTasks.find((item) => item.id === state.activeWorkshopTaskId);
    if (!workshopTask) {
      closeSheet();
      showToast("Tache introuvable.");
      return;
    }

    workshopTask.group = String(formData.get("group") ?? "standard");
    workshopTask.label = String(formData.get("label") ?? "").trim();
    workshopTask.recurring = formData.get("recurring") === "on";
    persistDb();
    clearSheetDraftByAction("editWorkshopTask", workshopTask.id);
    closeSheet();
    requestRender({ transition: true });
    showToast("Tache mise a jour.");
    return;
  }

  if (state.activeSheetAction === "addProductionItem") {
    const quantity = Math.max(1, Number(formData.get("quantity") ?? 1) || 1);
    db.productionItems.unshift({
      id: nextId(db.productionItems),
      clientType: String(formData.get("clientType") ?? "perso"),
      label: String(formData.get("label") ?? "").trim(),
      reference: String(formData.get("reference") ?? "").trim(),
      size: String(formData.get("size") ?? "").trim(),
      prints: Array.from({ length: quantity }, (_, index) => ({
        id: index + 1,
        checked: false
      })),
      status: PRODUCTION_STATUS_DEFAULT,
      errorNote: "",
      createdAt: isoNow(),
      updatedAt: isoNow()
    });
    persistDb();
    clearSheetDraftByAction("addProductionItem");
    closeSheet();
    requestRender({ transition: true });
    showToast("Ligne production ajoutee.");
    return;
  }

  if (state.activeSheetAction === "addPurchaseItem") {
    db.purchaseItems.unshift({
      id: nextId(db.purchaseItems),
      zone: String(formData.get("zone") ?? "SXM"),
      label: String(formData.get("label") ?? "").trim(),
      quantity: Math.max(1, Number(formData.get("quantity") ?? 1) || 1),
      checked: false,
      createdAt: isoToday()
    });
    persistDb();
    clearSheetDraftByAction("addPurchaseItem");
    closeSheet();
    requestRender({ transition: true });
    showToast("Article achat ajoute.");
    return;
  }

  if (state.activeSheetAction === "addWorkshopTask") {
    db.workshopTasks.unshift({
      id: nextId(db.workshopTasks),
      group: String(formData.get("group") ?? "standard"),
      label: String(formData.get("label") ?? "").trim(),
      checked: false,
      recurring: formData.get("recurring") === "on",
      createdAt: isoToday()
    });
    persistDb();
    clearSheetDraftByAction("addWorkshopTask");
    closeSheet();
    requestRender({ transition: true });
    showToast("Tache atelier ajoutee.");
    return;
  }

  if (state.activeSheetAction === "editImprovementItem") {
    const improvementItem = db.improvementItems.find((item) => item.id === state.activeImprovementId);
    if (!improvementItem) {
      closeSheet();
      showToast("Remontee introuvable.");
      return;
    }

    improvementItem.type = String(formData.get("type") ?? "bug");
    improvementItem.label = String(formData.get("label") ?? "").trim();
    persistDb();
    clearSheetDraftByAction("editImprovementItem", improvementItem.id);
    closeSheet();
    requestRender({ transition: true });
    showToast("Remontee mise a jour.");
    return;
  }

  if (state.activeSheetAction === "addTestPlanningOrder") {
    const client = parseTestPlanningClient(formData.get("clientName"));
    db.testPlanningItems.unshift({
      id: nextId(db.testPlanningItems),
      clientType: String(formData.get("clientType") ?? "").trim().toUpperCase(),
      clientId: client.clientId,
      clientName: client.clientName,
      family: String(formData.get("family") ?? "").trim().toUpperCase(),
      product: String(formData.get("product") ?? "").trim().toUpperCase(),
      quantity: String(formData.get("quantity") ?? "").trim(),
      note: String(formData.get("note") ?? "").trim(),
      deliveryDate: String(formData.get("deliveryDate") ?? "").trim(),
      needsMockup: formData.get("needsMockup") === "on",
      mockupStatus: String(formData.get("mockupStatus") ?? "").trim(),
      mockupCompletedAt: "",
      status: String(formData.get("status") ?? "").trim(),
      stage: normalizeTestPlanningStage(formData.get("stage")),
      assignedTo: normalizeImportedAssignee(formData.get("assignedTo")),
      createdAt: isoNow()
    });
    persistDb();
    clearSheetDraftByAction("addTestPlanningOrder");
    state.activeTestStage = null;
    closeSheet();
    requestRender({ transition: true });
    showToast("Ligne test planning ajoutée.");
    return;
  }

  if (state.activeSheetAction === "editTestPlanningOrder") {
    const item = db.testPlanningItems.find((entry) => entry.id === state.activeTestPlanningId);
    if (!item) {
      closeSheet();
      showToast("Ligne test planning introuvable.");
      return;
    }

    const client = parseTestPlanningClient(formData.get("clientName"));
    item.clientType = String(formData.get("clientType") ?? "").trim().toUpperCase();
    item.clientId = client.clientId;
    item.clientName = client.clientName;
    item.family = String(formData.get("family") ?? "").trim().toUpperCase();
    item.product = String(formData.get("product") ?? "").trim().toUpperCase();
    item.quantity = String(formData.get("quantity") ?? "").trim();
    item.note = String(formData.get("note") ?? "").trim();
    item.deliveryDate = String(formData.get("deliveryDate") ?? "").trim();
    item.needsMockup = formData.get("needsMockup") === "on";
    item.mockupStatus = String(formData.get("mockupStatus") ?? "").trim();
    if (item.needsMockup && item.mockupCompletedAt) {
      // keep mockupCompletedAt
    } else if (!item.needsMockup) {
      item.mockupCompletedAt = "";
    }
    item.status = String(formData.get("status") ?? "").trim();
    item.stage = normalizeTestPlanningStage(formData.get("stage"));
    item.assignedTo = normalizeImportedAssignee(formData.get("assignedTo"));
    persistDb();
    clearSheetDraftByAction("editTestPlanningOrder", item.id);
    closeSheet();
    requestRender({ transition: true });
    showToast("Ligne test planning mise à jour.");
  }
}

function render() {
  requestRender();
}

function requestRender(options = {}) {
  const next = {
    header: options.header ?? true,
    status: options.status ?? true,
    view: options.view ?? true,
    transition: Boolean(options.transition)
  };

  pendingRender.header = next.header || pendingRender.header;
  pendingRender.status = next.status || pendingRender.status;
  pendingRender.view = next.view || pendingRender.view;
  pendingRender.transition = next.transition || pendingRender.transition;

  if (renderQueued) {
    return;
  }

  renderQueued = true;

  requestAnimationFrame(() => {
    renderQueued = false;

    const commit = () => {
      try {
        if (pendingRender.header) {
          syncHeader();
          syncMenu();
        }

        if (pendingRender.status) {
          renderStatusStrip();
        }

        if (pendingRender.view) {
          renderView();
          syncTeamNoteEditors();
        }
      } catch (error) {
        handleFatalUiError(error);
      } finally {
        pendingRender = {
          header: false,
          status: false,
          view: false,
          transition: false
        };
      }
    };

    if (pendingRender.transition && typeof document.startViewTransition === "function") {
      document.startViewTransition(commit);
      return;
    }

    commit();
  });
}

function syncHeader() {
  const config = views[state.view];
  refs.pageEyebrow.textContent = config.eyebrow;
  refs.pageTitle.textContent = config.label;
  refs.pageIntro.textContent = config.intro;
  refs.globalSearch.placeholder = config.searchPlaceholder;

  if (config.primaryAction) {
    refs.primaryActionButton.hidden = false;
    refs.primaryActionButton.disabled = false;
    refs.primaryActionButton.style.display = "";
    refs.primaryActionButton.textContent = primaryLabel(config.primaryAction);
  } else {
    refs.primaryActionButton.hidden = true;
    refs.primaryActionButton.disabled = true;
    refs.primaryActionButton.style.display = "none";
    refs.primaryActionButton.textContent = "";
  }
}

function syncMenu() {
  refs.menuLinks.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === state.view);
  });
}

function renderStatusStrip() {
  refs.statusStrip.hidden = true;
  refs.statusStrip.innerHTML = "";
}

function renderView() {
  switch (state.view) {
    case "tasks":
      refs.viewRoot.innerHTML = renderTasksView();
      break;
    case "testPlanning":
      refs.viewRoot.innerHTML = renderTestPlanningView();
      break;
    case "clients":
      refs.viewRoot.innerHTML = renderClientsView();
      break;
    case "dtf":
      refs.viewRoot.innerHTML = renderDtfView();
      break;
    case "dtfMockups":
      refs.viewRoot.innerHTML = renderMockupsView();
      break;
    case "production":
      refs.viewRoot.innerHTML = renderProductionView();
      break;
    case "textile":
      refs.viewRoot.innerHTML = renderTextileView();
      break;
    case "purchase":
      refs.viewRoot.innerHTML = renderPurchaseView();
      break;
    case "improvements":
      refs.viewRoot.innerHTML = renderImprovementsView();
      break;
    case "workshop":
      refs.viewRoot.innerHTML = renderWorkshopView();
      break;
    default:
      refs.viewRoot.innerHTML = renderPlaceholderView();
      break;
  }

  syncProofingFields(refs.viewRoot);
}

function renderPlaceholderView() {
  return `
    <section class="module-layout">
      <article class="placeholder-card">
        <p class="module-kicker">${escapeHtml(views[state.view].label)}</p>
        <strong>Module en attente de construction</strong>
      </article>
    </section>
  `;
}

function isUrgentTestPlanningItem(item) {
  if (!item.deliveryDate) return false;
  if (item.stage === "facture" || item.stage === "paye" || item.stage === "archived") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delivery = new Date(item.deliveryDate + "T00:00:00");
  if (Number.isNaN(delivery.getTime())) return false;
  const diffDays = Math.floor((delivery - today) / (1000 * 60 * 60 * 24));
  return diffDays <= 3;
}

function renderTestPlanningView() {
  const sections = TEST_PLANNING_STAGES.map((stage) => ({
    ...stage,
    rows: getVisibleTestPlanningItems(stage.key)
  }));

  const urgentItems = db.testPlanningItems.filter((item) => {
    if (!isUrgentTestPlanningItem(item)) return false;
    if (state.activeTestAssignee && item.assignedTo !== state.activeTestAssignee) return false;
    if (!state.search) return true;
    return [item.clientName, item.family, item.product, item.quantity, item.note, item.status, item.mockupStatus || ""]
      .join(" ").toLowerCase().includes(state.search);
  }).slice().sort((a, b) => (b.id || 0) - (a.id || 0));

  const activeStage = state.activeTestStage;
  let bodyHtml;

  if (activeStage === "__urgent__") {
    bodyHtml = urgentItems.length
      ? `<section class="test-planning-board">${urgentItems.map(renderTestPlanningCard).join("")}</section>`
      : `<div class="empty-state">Aucune commande urgente.</div>`;
  } else if (activeStage) {
    const filteredItems = db.testPlanningItems
      .filter((item) => {
        if (item.stage !== activeStage) return false;
        if (state.activeTestAssignee && item.assignedTo !== state.activeTestAssignee) return false;
        if (!state.search) return true;
        return [item.clientName, item.family, item.product, item.quantity, item.note, item.status, item.mockupStatus || ""]
          .join(" ").toLowerCase().includes(state.search);
      })
      .slice()
      .sort((a, b) => (b.id || 0) - (a.id || 0));
    bodyHtml = filteredItems.length
      ? `<section class="test-planning-board">${filteredItems.map(renderTestPlanningCard).join("")}</section>`
      : `<div class="empty-state">Aucune commande pour cette sélection.</div>`;
  } else {
    const allItems = db.testPlanningItems
      .filter((item) => {
        if (item.stage === "archived") return false;
        if (state.activeTestAssignee && item.assignedTo !== state.activeTestAssignee) return false;
        if (!state.search) return true;
        return [item.clientName, item.family, item.product, item.quantity, item.note, item.status, item.mockupStatus || ""]
          .join(" ").toLowerCase().includes(state.search);
      })
      .slice()
      .sort((a, b) => (b.id || 0) - (a.id || 0));
    bodyHtml = allItems.length
      ? `<section class="test-planning-board">${allItems.map(renderTestPlanningCard).join("")}</section>`
      : `<div class="empty-state">Aucune commande.</div>`;
  }

  const activeAssignee = state.activeTestAssignee;
  const assigneeChips = ORDER_ASSIGNEES.map((a) => {
    const isActive = activeAssignee === a;
    return `<button class="test-step-chip test-assignee-chip ${isActive ? "is-active" : ""}" type="button" data-test-assignee-filter="${escapeHtml(a)}">${escapeHtml(a)}</button>`;
  }).join("");

  return `
    <section class="module-layout">
      <section class="test-planning-steps">
        <button class="test-step-chip ${!activeStage ? "is-active" : ""}" type="button" data-test-stage-jump="__recent__" data-accent="blue">
          <span>Toutes</span>
          <strong>${sections.filter(s => s.key !== "archived").reduce((sum, s) => sum + s.rows.length, 0)}</strong>
        </button>
        <button class="test-step-chip ${activeStage === "__urgent__" ? "is-active" : ""}" type="button" data-test-stage-jump="__urgent__" data-accent="red">
          <span>Urgence</span>
          <strong>${urgentItems.length}</strong>
        </button>
        ${sections.map(renderTestPlanningStepSummary).join("")}
      </section>
      <section class="test-planning-assignee-filters">
        ${assigneeChips}
      </section>
      ${bodyHtml}
    </section>
  `;
}

function renderTestPlanningStepSummary(stage) {
  const isActive = state.activeTestStage === stage.key;
  return `
    <button class="test-step-chip ${isActive ? "is-active" : ""}" type="button" data-test-stage-jump="${escapeHtml(stage.key)}" data-accent="${escapeHtml(stage.accent)}">
      <span>${escapeHtml(stage.shortLabel)}</span>
      <strong>${stage.rows.length}</strong>
    </button>
  `;
}

function renderTestPlanningStageColumn(stage) {
  return `
    <article class="test-stage-column" id="test-stage-${escapeHtml(stage.key)}" data-accent="${escapeHtml(stage.accent)}">
      <header class="test-stage-head">
        <div>
          <p class="module-kicker">${escapeHtml(stage.label)}</p>
          <strong>${stage.rows.length} ligne${stage.rows.length > 1 ? "s" : ""}</strong>
        </div>
        <span class="test-stage-count">${stage.rows.length}</span>
      </header>
      <div class="test-stage-body">
        ${stage.rows.length ? stage.rows.map(renderTestPlanningCard).join("") : `<div class="empty-state">Aucune ligne.</div>`}
      </div>
    </article>
  `;
}

function renderTestPlanningCard(item) {
  const stageIndex = TEST_PLANNING_STAGE_KEYS.indexOf(item.stage);
  const canGoPrev = stageIndex > 0;
  const canGoNext = stageIndex < TEST_PLANNING_STAGE_KEYS.length - 1;
  const stageLabel = TEST_PLANNING_STAGES[stageIndex]?.label ?? "";
  const stageAccent = TEST_PLANNING_STAGES[stageIndex]?.accent ?? "blue";
  var createdLabel = "";
  if (item.createdAt) {
    var d = new Date(item.createdAt);
    if (!isNaN(d.getTime())) {
      createdLabel = String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    }
  }
  const mockupTag = item.needsMockup && !item.mockupCompletedAt
    ? '<span class="tp-mockup-corner">🎨</span>'
    : item.needsMockup && item.mockupCompletedAt
      ? '<span class="tp-mockup-corner is-done">✓</span>'
      : "";
  return `
    <article class="tp-line" data-test-planning-id="${item.id}" data-accent="${escapeHtml(stageAccent)}" tabindex="0">
      ${mockupTag}
      <span class="tp-accent" data-accent="${escapeHtml(stageAccent)}"></span>
      <div class="tp-grid">
        <span class="tp-badge" data-accent="${escapeHtml(stageAccent)}">${escapeHtml(stageLabel)}</span>
        <span class="tp-type">${escapeHtml(item.clientType || "—")}</span>
        <strong class="tp-client">${escapeHtml(item.clientName || "Client")}</strong>
        <span class="tp-family">${escapeHtml(item.family || "—")}</span>
        <span class="tp-product">${escapeHtml(item.product || "—")}</span>
        <span class="tp-qty">${escapeHtml(item.quantity ? "×" + item.quantity : "—")}</span>
        <span class="tp-date">${escapeHtml(item.deliveryDate ? formatDate(item.deliveryDate) : "—")}</span>
        <span class="tp-status" data-inline-status="${item.id}" title="Cliquer pour changer">${escapeHtml(item.status || stageLabel)}</span>
        <select class="inline-status-select is-hidden" data-inline-status-sel="${item.id}"><option value="">— État —</option>${renderTestPlanningStatusOptgroups(item.status)}</select>
        <span class="tp-actions">
          <button class="pill-button" type="button" data-action="test-planning-prev-stage" data-id="${item.id}" title="Étape précédente" ${canGoPrev ? "" : "disabled"}>←</button>
          <button class="pill-button" type="button" data-action="test-planning-next-stage" data-id="${item.id}" title="Étape suivante" ${canGoNext ? "" : "disabled"}>→</button>
          <button class="row-action row-action-subtle is-danger" type="button" data-action="delete-test-planning" data-id="${item.id}" aria-label="Supprimer">×</button>
        </span>
      </div>
      ${item.note ? '<div class="tp-sub"><span class="tp-note">' + escapeHtml(item.note) + '</span></div>' : ""}
      ${createdLabel ? `<time class="tp-time">${createdLabel}</time>` : ""}
    </article>
  `;
}

function renderTasksView() {
  const notes = getVisibleTeamNotes();
  return `
    <section class="module-layout">
      <section class="team-notes-grid">
        ${notes.map(renderTeamNoteCard).join("")}
      </section>
    </section>
  `;
}

function renderTeamNoteCard(note) {
  const visibleItems = getVisibleTeamNoteItems(note);
  return `
    <article class="team-note-card" data-tone="${teamNoteTone(note.name)}">
      <header class="team-note-head">
        <div>
          <h3>${escapeHtml(note.name)}</h3>
        </div>
        <span class="chip">${note.updatedAt ? escapeHtml(formatDate(note.updatedAt)) : "Vide"}</span>
      </header>
      <label class="team-note-summary">
        <span class="team-note-summary-label">Informations importantes</span>
        <textarea
          class="team-note-summary-input"
          name="team-note-summary"
          rows="2"
          data-note-id="${note.id}"
          placeholder="Ajouter une information..."
        >${escapeHtml(note.summary ?? "")}</textarea>
      </label>
      <form class="team-note-add" data-form="team-note-add">
        <input type="hidden" name="noteId" value="${note.id}">
        <div class="quick-add-row team-note-add-row">
          <input name="label" type="text">
          <button class="button" type="submit">Ajouter</button>
        </div>
      </form>
      <div class="team-note-list" aria-label="Notes de ${escapeHtml(note.name)}">
        ${visibleItems.length ? visibleItems.map((item) => renderTeamNoteItem(note.id, item)).join("") : `<div class="empty-state">Aucune ligne.</div>`}
      </div>
    </article>
  `;
}

function renderTeamNoteItem(noteId, item) {
  return `
    <article class="team-note-item" data-checked="${item.checked ? "true" : "false"}">
      <button class="team-note-dot" type="button" data-action="toggle-team-note-item" data-note-id="${noteId}" data-item-id="${item.id}" aria-label="${item.checked ? "Marquer comme non faite" : "Marquer comme faite"}"></button>
      <form class="team-note-edit" data-form="team-note-edit">
        <input type="hidden" name="noteId" value="${noteId}">
        <input type="hidden" name="itemId" value="${item.id}">
        <textarea
          class="team-note-edit-input"
          name="team-note-edit-label"
          rows="1"
          data-note-id="${noteId}"
          data-item-id="${item.id}"
          autocomplete="off"
        >${escapeHtml(item.label)}</textarea>
      </form>
      <button class="row-action row-action-subtle is-danger" type="button" data-action="delete-team-note-item" data-note-id="${noteId}" data-item-id="${item.id}" aria-label="Supprimer la ligne">×</button>
    </article>
  `;
}

function renderClientsView() {
  const rows = getVisibleClientRows();
  return `
    <section class="module-layout">
      <article class="module-panel orders-toolbar">
        <header class="module-head orders-toolbar-head">
          <div>
            <p class="module-kicker">Liste</p>
            <h3>Clients Pro</h3>
          </div>
          <div class="module-actions">
            <span class="chip">${rows.length} ligne${rows.length > 1 ? "s" : ""}</span>
          </div>
        </header>
      </article>
      <div class="table-shell">
        <div class="dense-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Société</th>
                <th>Ville</th>
                <th>Contact</th>
                <th>Tél.</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              ${rows.length ? rows.map(renderClientRow).join("") : `<tr><td colspan="5"><div class="empty-state">Aucun client ne correspond a la recherche.</div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function renderClientRow(row) {
  const client = row.client;
  const contact = row.contact;
  return `
    <tr data-client-id="${client.id}" data-contact-id="${contact.id}" tabindex="0">
      <td><strong>${escapeHtml(client.name)}</strong></td>
      <td>${escapeHtml(client.city || "—")}</td>
      <td>${escapeHtml(contact.name || "—")}</td>
      <td>${escapeHtml(contact.phone || "—")}</td>
      <td>${escapeHtml(contact.email || "—")}</td>
    </tr>
  `;
}

function renderDtfView() {
  const rows = getVisibleDtfItems();
  const archiveCount = db.dtfRequests.filter((item) => item.archivedAt).length;
  const allSelected = rows.length > 0 && rows.every((row) => state.selectedDtfIds.has(row.id));
  const isMockupView = state.view === "dtfMockups";

  return `
    <section class="module-layout">
      <div class="archive-toggle">
        <div>
          <strong>${isMockupView ? "Archives maquettes" : "Archives DTF"}</strong>
          <p class="archive-copy">${archiveCount}</p>
        </div>
        <div class="archive-actions">
          <button class="pill-button ${state.showDtfArchives ? "is-active" : ""}" type="button" data-action="toggle-dtf-archives">
            ${state.showDtfArchives ? "Voir les actives" : "Voir les archives"}
          </button>
      </div>
      </div>
      ${state.selectedDtfIds.size ? renderDtfSelectionBar() : ""}
      <div class="table-shell">
        <div class="dense-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th class="checkbox-cell"><input type="checkbox" name="dtf-select-all" ${allSelected ? "checked" : ""}></th>
                <th>Date</th>
                <th>Client</th>
                <th>Design</th>
                <th>Dimension</th>
                <th>Logo</th>
                <th>Taille</th>
                <th>Couleur</th>
                <th>Note</th>
                <th>Qte</th>
                <th>Type</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${rows.length ? rows.map(renderDtfRow).join("") : `<tr><td colspan="12"><div class="empty-state">${isMockupView ? "Aucune maquette DTF a afficher." : "Aucune demande DTF a afficher."}</div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function renderDtfSelectionBar() {
  return `
    <section class="selection-bar">
      <div>
        <strong>${state.selectedDtfIds.size} selection${state.selectedDtfIds.size > 1 ? "s" : ""}</strong>
      </div>
      <div class="selection-actions">
        <button class="pill-button" type="button" data-action="duplicate-dtf">Dupliquer</button>
        <button class="pill-button" type="button" data-action="validate-dtf">Valider</button>
        <button class="pill-button" type="button" data-action="archive-dtf">${state.showDtfArchives ? "Restaurer" : "Archiver"}</button>
        <button class="pill-button" type="button" data-action="delete-dtf">Supprimer</button>
      </div>
    </section>
  `;
}

function renderDtfRow(row) {
  const checked = state.selectedDtfIds.has(row.id);
  const typeTone = row.mockupCompletedAt ? "ready" : row.needsMockup ? "urgent" : (row.clientType === "pro" ? "pro" : "perso");
  const typeLabel = row.mockupCompletedAt ? "Maquette faite" : row.needsMockup ? "Maquette" : (row.clientType === "pro" ? "PRO" : "Perso");
  return `
    <tr data-dtf-id="${row.id}">
      <td class="checkbox-cell"><input type="checkbox" name="dtf-select" value="${row.id}" ${checked ? "checked" : ""}></td>
      <td><span class="order-date-chip">${formatDate(row.createdAt)}</span></td>
      <td>${escapeHtml(dtfClientLabel(row))}</td>
      <td><strong>${escapeHtml(row.designName)}</strong></td>
      <td>${escapeHtml(row.dimensions)}</td>
      <td><span class="status-badge" data-tone="draft">${escapeHtml(normalizeLogoPlacement(row.logoPlacement))}</span></td>
      <td>${escapeHtml(row.size)}</td>
      <td>${escapeHtml(row.color)}</td>
      <td>${escapeHtml(row.technicalNote)}</td>
      <td>${row.quantity}</td>
      <td><span class="status-badge" data-tone="${typeTone}">${typeLabel}</span></td>
      <td>
        <div class="row-actions">
          <button class="row-action" type="button" data-action="${row.archivedAt ? "restore-single-dtf" : "archive-single-dtf"}" data-id="${row.id}">
            ${row.archivedAt ? "↺" : "⤴"}
          </button>
          <button class="row-action is-danger" type="button" data-action="delete-single-dtf" data-id="${row.id}">×</button>
        </div>
      </td>
    </tr>
  `;
}

function renderMockupsView() {
  const rows = getVisibleMockupItems();
  const archiveCount = db.dtfRequests.filter((item) => item.archivedAt && item.needsMockup).length;

  return `
    <section class="module-layout orders-layout">
      <div class="archive-toggle">
        <div>
          <strong>Archives maquettes</strong>
          <p class="archive-copy">${archiveCount}</p>
        </div>
        <div class="archive-actions">
          <button class="pill-button ${state.showDtfArchives ? "is-active" : ""}" type="button" data-action="toggle-dtf-archives">
            ${state.showDtfArchives ? "Voir les actives" : "Voir les archives"}
          </button>
        </div>
      </div>
      <section class="orders-board">
        <div class="orders-list">
          ${rows.length ? rows.map(renderMockupRow).join("") : `<div class="empty-state">Aucune maquette a faire.</div>`}
        </div>
      </section>
    </section>
  `;
}

function renderMockupRow(item) {
  const isTestPlanning = item.kind === "testPlanning";
  const sourceLabel = isTestPlanning ? "Planning" : "DTF";
  const zoneLabel = item.zone || (isTestPlanning ? "Commandes générales" : "DTF");
  const completeAction = isTestPlanning ? "complete-test-planning-mockup" : "complete-dtf-mockup";
  return `
    <article class="order-card order-card-line" data-zone="${escapeHtml(zoneLabel)}">
      <div class="order-line-primary">
        <div class="order-line-summary order-line-primary-main">
          <strong class="order-client-name">${escapeHtml(item.client)}</strong>
          <span class="order-zone-chip" data-zone="${escapeHtml(zoneLabel)}">${escapeHtml(zoneLabel)}</span>
          <span class="order-type-badge" data-tone="pro">${sourceLabel}</span>
          ${item.quantity > 0 ? `<span class="order-qty-chip">${item.quantity}</span>` : ""}
          ${item.meta ? `<span class="order-inline-copy">${escapeHtml(item.meta)}</span>` : ""}
        </div>
        <div class="order-line-primary-note">
          <span class="order-inline-copy order-inline-note">${escapeHtml(item.title)}</span>
        </div>
      </div>
      <div class="order-line-meta">
        <div class="order-deadline">
          <strong>${escapeHtml(item.date ? formatDate(item.date) : "—")}</strong>
        </div>
      </div>
      <div class="order-card-controls order-card-controls-line">
        <div class="order-controls-inline">
          <button class="button button-primary" type="button" data-action="${completeAction}" data-id="${item.id}">
            Maquette faite
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderProductionView() {
  const rows = getVisibleProductionItems();
  return `
    <section class="module-layout">
      <article class="module-panel orders-toolbar">
        <header class="module-head orders-toolbar-head">
          <div>
            <p class="module-kicker">Suivi atelier</p>
            <h3>Production</h3>
          </div>
          <div class="module-actions">
            <span class="chip">${rows.length} PRT${rows.length > 1 ? "s" : ""}</span>
          </div>
        </header>
      </article>
      <section class="orders-board">
        <div class="orders-list production-list">
          ${rows.length ? rows.map(renderProductionItem).join("") : `<div class="empty-state">Aucune ligne de production.</div>`}
        </div>
      </section>
    </section>
  `;
}

function renderProductionItem(item) {
  const showError = item.status === "Erreur";
  const totalPrints = getProductionQuantity(item);
  const completedPrints = getProductionCompletedCount(item);
  return `
    <article class="order-card production-card" data-status="${escapeHtml(item.status)}">
      <div class="production-card-main">
        <div class="order-line-summary">
          <strong class="order-client-name">${escapeHtml(item.label)}</strong>
          <span class="order-type-badge" data-tone="${item.clientType === "pro" ? "pro" : "perso"}">${item.clientType === "pro" ? "PRO" : "Perso"}</span>
          ${item.reference ? `<span class="order-inline-copy">${escapeHtml(item.reference)}</span>` : ""}
          ${item.size ? `<span class="order-qty-chip">${escapeHtml(item.size)}</span>` : ""}
          <span class="status-badge" data-tone="${productionTone(item.status)}">${escapeHtml(item.status)}</span>
          <span class="order-qty-chip">${completedPrints}/${totalPrints}</span>
        </div>
        <div class="production-checklist" aria-label="Points de production">
          ${item.prints.map((print) => `
            <label class="production-checkpoint">
              <input
                type="checkbox"
                name="production-print-checked"
                data-id="${item.id}"
                value="${print.id}"
                ${print.checked ? "checked" : ""}
              >
              <span></span>
            </label>
          `).join("")}
        </div>
        ${showError && item.errorNote ? `<p class="production-error-copy">${escapeHtml(item.errorNote)}</p>` : ""}
      </div>
      <div class="production-counter" aria-label="Compteur">
        <button class="row-action" type="button" data-action="decrease-production-quantity" data-id="${item.id}" aria-label="Diminuer">−</button>
        <strong>${totalPrints}</strong>
        <button class="row-action" type="button" data-action="increase-production-quantity" data-id="${item.id}" aria-label="Augmenter">+</button>
      </div>
      <div class="production-card-controls">
        <select class="field-select table-status-select" name="production-status" data-id="${item.id}" aria-label="Statut production">
          ${renderProductionStatusOptions(item.status)}
        </select>
        <button class="row-action" type="button" data-action="duplicate-production-item" data-id="${item.id}" aria-label="Dupliquer">⧉</button>
        <button class="row-action is-danger" type="button" data-action="delete-production-item" data-id="${item.id}" aria-label="Supprimer la ligne">×</button>
      </div>
      ${showError ? `
        <label class="production-error-field">
          <span class="field-label">Erreur</span>
          <textarea class="field-textarea production-error-textarea" name="production-error" data-id="${item.id}" placeholder="Ajouter l'erreur...">${escapeHtml(item.errorNote ?? "")}</textarea>
        </label>
      ` : ""}
    </article>
  `;
}

function renderTextileView() {
  const rows = getVisibleTextileOrders();
  const archiveCount = db.textileOrders.filter((item) => item.archivedAt).length;
  return `
    <section class="module-layout">
      <div class="archive-toggle">
        <div>
          <strong>Commandes fournisseur</strong>
          <p class="archive-copy">${archiveCount}</p>
        </div>
        <div class="archive-actions">
          <button class="pill-button ${state.showTextileArchives ? "is-active" : ""}" type="button" data-action="toggle-textile-archives">
            ${state.showTextileArchives ? "Voir les actives" : "Voir les archives"}
          </button>
        </div>
      </div>
      <div class="table-shell">
        <div class="dense-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                ${TEXTILE_COLUMN_DEFINITIONS.map((column) => renderTextileHead(column.label, column.key)).join("")}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${rows.length ? rows.map(renderTextileRow).join("") : `<tr><td colspan="13"><div class="empty-state">Aucune commande textile a afficher.</div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function renderTextileHead(label, key) {
  const direction = state.textileSort.key === key ? state.textileSort.direction : "";
  return `<th><button class="sort-button" type="button" data-action="sort-textile" data-key="${key}" ${direction ? `data-direction="${direction}"` : ""}>${label}</button></th>`;
}

function renderTextileRow(row) {
  return `
    <tr data-textile-id="${row.id}" tabindex="0">
      <td>${escapeHtml(textileClientLabel(row))}</td>
      <td>${escapeHtml(row.supplier)}</td>
      <td>${escapeHtml(row.brand)}</td>
      <td>${escapeHtml(row.gender)}</td>
      <td>${escapeHtml(row.designation)}</td>
      <td>${escapeHtml(row.catalogReference)}</td>
      <td>${escapeHtml(row.color)}</td>
      <td>${escapeHtml(row.size)}</td>
      <td>${row.quantity}</td>
      <td><span class="delivery-badge" data-tone="${deliveryTone(row.deliveryStatus)}">${escapeHtml(row.deliveryStatus)}</span></td>
      <td>${escapeHtml(row.sessionLabel)}</td>
      <td>${formatDate(row.expectedDate)}</td>
      <td>
        <div class="row-actions">
          <button class="row-action" type="button" data-action="${row.archivedAt ? "restore-textile" : "archive-textile"}" data-id="${row.id}">
            ${row.archivedAt ? "↺" : "⤴"}
          </button>
          <button class="row-action is-danger" type="button" data-action="delete-textile" data-id="${row.id}">×</button>
        </div>
      </td>
    </tr>
  `;
}

function renderPurchaseView() {
  const zones = ["SXM", "Europe", "USA"];
  return `
    <section class="module-layout">
      <div class="zone-grid">
        ${zones.map(renderPurchaseZone).join("")}
      </div>
    </section>
  `;
}

function renderPurchaseZone(zone) {
  const items = getVisiblePurchaseItems(zone);
  return `
    <article class="zone-column">
      <header class="module-head">
        <div>
          <p class="module-kicker">${zone}</p>
          <h3>${items.length} article${items.length > 1 ? "s" : ""}</h3>
        </div>
      </header>
      <div class="module-body">
        <form class="quick-add" data-form="purchase-quick-add">
          <input type="hidden" name="zone" value="${zone}">
          <div class="quick-add-row">
            <input name="label" type="text" placeholder="Nouvel article">
            <button class="button" type="submit">Ajouter</button>
          </div>
        </form>
        <div class="list-grid">
          ${items.length ? items.map(renderPurchaseItem).join("") : `<div class="empty-state">Aucun article pour ${zone}.</div>`}
        </div>
      </div>
    </article>
  `;
}

function renderPurchaseItem(item) {
  return `
    <article class="item-row" data-purchase-id="${item.id}" tabindex="0">
      <label class="stack-meta">
        <input type="checkbox" name="purchase-checked" value="${item.id}" ${item.checked ? "checked" : ""}>
        <strong>${escapeHtml(item.label)}</strong>
        <span>x${item.quantity}</span>
      </label>
      <button class="row-action is-danger" type="button" data-action="delete-purchase" data-id="${item.id}">×</button>
    </article>
  `;
}

function renderWorkshopView() {
  const groups = [
    { key: "standard", label: "Standard" },
    { key: "atelier", label: "Atelier" },
    { key: "dtf", label: "DTF" }
  ];

  return `
    <section class="module-layout">
      <div class="task-grid">
        ${groups.map(renderWorkshopColumn).join("")}
      </div>
    </section>
  `;
}

function renderWorkshopColumn(group) {
  const tasks = getVisibleWorkshopTasks(group.key);
  return `
    <article class="task-column">
      <header class="module-head">
        <div>
          <p class="module-kicker">${group.label}</p>
          <h3>${tasks.filter((item) => !item.checked).length} restantes</h3>
        </div>
      </header>
      <div class="module-body">
        <form class="quick-add" data-form="task-quick-add">
          <input type="hidden" name="group" value="${group.key}">
          <div class="quick-add-row">
            <input name="label" type="text" placeholder="Nouvelle tache">
            <button class="button" type="submit">Ajouter</button>
            <span></span>
          </div>
        </form>
        <div class="list-grid">
          ${tasks.length ? tasks.map(renderWorkshopTask).join("") : `<div class="empty-state">Aucune tache dans ${group.label}.</div>`}
        </div>
      </div>
    </article>
  `;
}

function renderWorkshopTask(task) {
  return `
    <article class="task-row" data-workshop-task-id="${task.id}" tabindex="0">
      <label class="stack-meta">
        <input type="checkbox" name="task-checked" value="${task.id}" ${task.checked ? "checked" : ""}>
        <strong>${escapeHtml(task.label)}</strong>
        <span>${task.recurring ? "Recurrente" : "Ponctuelle"}</span>
      </label>
      <button class="row-action is-danger" type="button" data-action="delete-task" data-id="${task.id}">×</button>
    </article>
  `;
}

function renderImprovementsView() {
  return `
    <section class="module-layout">
      <div class="task-grid">
        ${IMPROVEMENT_TYPES.map(renderImprovementColumn).join("")}
      </div>
    </section>
  `;
}

function renderImprovementColumn(type) {
  const items = getVisibleImprovementItems(type.key);
  return `
    <article class="task-column">
      <header class="module-head">
        <div>
          <p class="module-kicker">${escapeHtml(type.label)}</p>
          <h3>${items.length} ligne${items.length > 1 ? "s" : ""}</h3>
        </div>
      </header>
      <div class="module-body">
        <form class="quick-add" data-form="improvement-quick-add">
          <input type="hidden" name="type" value="${type.key}">
          <div class="quick-add-row">
            <input name="label" type="text" placeholder="Nouvelle remontee">
            <button class="button" type="submit">Ajouter</button>
            <span></span>
          </div>
        </form>
        <div class="list-grid">
          ${items.length ? items.map(renderImprovementItem).join("") : `<div class="empty-state">Aucune remontee dans ${escapeHtml(type.label)}.</div>`}
        </div>
      </div>
    </article>
  `;
}

function renderImprovementItem(item) {
  return `
    <article class="task-row" data-improvement-id="${item.id}" tabindex="0">
      <div class="stack-meta">
        <strong>${escapeHtml(item.label)}</strong>
        <span>${escapeHtml(improvementTypeLabel(item.type))}</span>
      </div>
      <button class="row-action is-danger" type="button" data-action="delete-improvement" data-id="${item.id}">×</button>
    </article>
  `;
}

function openSheet(action, options = {}) {
  state.activeSheetAction = action;
  state.activeDtfId = action === "editDtf" ? options.id ?? null : null;
  state.activeTextileId = action === "editTextileOrder" ? options.id ?? null : null;
  state.activePurchaseId = action === "editPurchaseItem" ? options.id ?? null : null;
  state.activeWorkshopTaskId = action === "editWorkshopTask" ? options.id ?? null : null;
  state.activeImprovementId = action === "editImprovementItem" ? options.id ?? null : null;
  state.activeTestPlanningId = action === "editTestPlanningOrder" ? options.id ?? null : null;
  state.activeClientId = action === "editClient" ? options.id ?? null : null;
  pauseRemotePolling();
  refs.sheetDialog.dataset.layout = (
    action === "addDtf" || action === "editDtf" ? "dtf-inline"
      : action === "addTextileOrder" || action === "editTextileOrder" ? "textile-inline"
        : action === "addClient" || action === "editClient" ? "client-inline"
          : action === "addTestPlanningOrder" || action === "editTestPlanningOrder" ? "test-planning-inline"
          : ""
  );
  refs.sheetBody.innerHTML = renderSheetBody(action);
  if (action === "addTestPlanningOrder") {
    clearSheetDraftByAction(action);
  } else {
    restoreSheetDraft(action, options);
  }
  syncTestPlanningStageField();
  syncTestPlanningMockupField();
  syncProofingFields(refs.sheetBody);
  if (action === "addTestPlanningOrder" || action === "editTestPlanningOrder") {
    initTestPlanningClientAutocomplete();
  }
  const eyebrowLabel = sheetEyebrow(action);
  refs.sheetEyebrow.textContent = eyebrowLabel;
  refs.sheetEyebrow.hidden = !eyebrowLabel;
  refs.sheetTitle.textContent = primaryLabel(action);
  refs.submitSheetButton.textContent = submitLabel(action);
  refs.sheetDialog.showModal();
}

function syncProofingFields(root) {
  if (!(root instanceof Element || root instanceof Document)) {
    return;
  }

  root.querySelectorAll("input, textarea").forEach((field) => {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
      return;
    }

    const mode = spellcheckModeForField(field);
    if (!mode) {
      return;
    }

    field.setAttribute("spellcheck", "true");
    field.setAttribute("lang", "fr");
    field.setAttribute("autocorrect", "on");
    field.setAttribute("autocomplete", field.getAttribute("autocomplete") || "on");
    field.setAttribute("autocapitalize", mode);
  });
}

function spellcheckModeForField(field) {
  if (field instanceof HTMLTextAreaElement) {
    return "sentences";
  }

  if (!(field instanceof HTMLInputElement)) {
    return "";
  }

  const type = String(field.type || "text").toLowerCase();
  if (!["text", "search"].includes(type)) {
    return "";
  }

  const name = String(field.name || "").trim();
  if (SPELLCHECK_SENTENCE_FIELDS.has(name)) {
    return "sentences";
  }

  if (SPELLCHECK_WORD_FIELDS.has(name)) {
    return "words";
  }

  return "";
}

function closeSheet() {
  if (refs.sheetDialog.open) {
    refs.sheetDialog.close();
  }
  delete refs.sheetDialog.dataset.layout;
  state.activeSheetAction = null;
  state.activeOrderId = null;
  state.activeDtfId = null;
  state.activeTextileId = null;
  state.activePurchaseId = null;
  state.activeWorkshopTaskId = null;
  state.activeImprovementId = null;
  state.activeTestPlanningId = null;
  state.activeClientId = null;
  resumeRemotePolling();
}

function renderSheetBody(action) {
  if (action === "addClient") {
    return renderClientForm();
  }

  if (action === "editClient") {
    const client = db.clients.find((item) => item.id === state.activeClientId);
    if (!client) {
      return "";
    }

    return renderClientForm(client);
  }

  if (action === "addTestPlanningOrder") {
    return renderTestPlanningForm();
  }

  if (action === "editTestPlanningOrder") {
    const item = db.testPlanningItems.find((entry) => entry.id === state.activeTestPlanningId);
    if (!item) {
      return "";
    }

    return renderTestPlanningForm(item);
  }

  if (action === "addDtf") {
    return renderDtfForm();
  }

  if (action === "editDtf") {
    const dtf = db.dtfRequests.find((item) => item.id === state.activeDtfId);
    if (!dtf) {
      return "";
    }

    return renderDtfForm(dtf);
  }

  if (action === "addTextileOrder") {
    return renderTextileOrderForm();
  }

  if (action === "editTextileOrder") {
    const textileOrder = db.textileOrders.find((item) => item.id === state.activeTextileId);
    if (!textileOrder) {
      return "";
    }

    return renderTextileOrderForm(textileOrder);
  }

  if (action === "addProductionItem") {
    return `
      <div class="field-grid production-form-grid">
        <label>
          <span class="field-label">Type</span>
          <select class="field-select" name="clientType">
            <option value="perso" selected>Perso</option>
            <option value="pro">Pro</option>
          </select>
        </label>
        <label class="field-span">
          <span class="field-label">Nom du PRT</span>
          <input class="field-input" name="label" type="text" placeholder="Ex: Logo dos noir">
        </label>
        <label>
          <span class="field-label">Référence</span>
          <input class="field-input" name="reference" type="text" placeholder="Ex: H-001">
        </label>
        <label>
          <span class="field-label">Taille</span>
          <input class="field-input" name="size" type="text" placeholder="Ex: M, L, XL">
        </label>
        <label>
          <span class="field-label">Combien de fois</span>
          <input class="field-input" name="quantity" type="number" min="1" value="1">
        </label>
      </div>
    `;
  }

  if (action === "addPurchaseItem") {
    return renderPurchaseItemForm();
  }

  if (action === "editPurchaseItem") {
    const purchaseItem = db.purchaseItems.find((item) => item.id === state.activePurchaseId);
    if (!purchaseItem) {
      return "";
    }

    return renderPurchaseItemForm(purchaseItem);
  }

  if (action === "addWorkshopTask") {
    return renderWorkshopTaskForm();
  }

  if (action === "editWorkshopTask") {
    const workshopTask = db.workshopTasks.find((item) => item.id === state.activeWorkshopTaskId);
    if (!workshopTask) {
      return "";
    }

    return renderWorkshopTaskForm(workshopTask);
  }

  if (action === "editImprovementItem") {
    const improvementItem = db.improvementItems.find((item) => item.id === state.activeImprovementId);
    if (!improvementItem) {
      return "";
    }

    return renderImprovementForm(improvementItem);
  }

  return "";
}

function renderPurchaseItemForm(item = null) {
  return `
    <div class="field-grid">
      <label>
        <span class="field-label">Zone</span>
        <select class="field-select" name="zone">
          <option value="SXM" ${item?.zone === "SXM" ? "selected" : ""}>SXM</option>
          <option value="Europe" ${item?.zone === "Europe" ? "selected" : ""}>Europe</option>
          <option value="USA" ${item?.zone === "USA" ? "selected" : ""}>USA</option>
        </select>
      </label>
      <label>
        <span class="field-label">Quantite</span>
        <input class="field-input" name="quantity" type="number" min="1" value="${Math.max(1, Number(item?.quantity) || 1)}">
      </label>
      <label class="field-span">
        <span class="field-label">Article</span>
        <input class="field-input" name="label" type="text" value="${escapeHtml(item?.label ?? "")}">
      </label>
    </div>
  `;
}

function renderWorkshopTaskForm(task = null) {
  return `
    <div class="field-grid">
      <label>
        <span class="field-label">Categorie</span>
        <select class="field-select" name="group">
          <option value="standard" ${task?.group === "standard" ? "selected" : ""}>Standard</option>
          <option value="atelier" ${task?.group === "atelier" ? "selected" : ""}>Atelier</option>
          <option value="dtf" ${task?.group === "dtf" ? "selected" : ""}>DTF</option>
        </select>
      </label>
      <label class="field-span">
        <span class="field-label">Tache</span>
        <input class="field-input" name="label" type="text" value="${escapeHtml(task?.label ?? "")}">
      </label>
      <label>
        <span class="field-label">Recurrente</span>
        <input name="recurring" type="checkbox" ${task?.recurring ? "checked" : ""}>
      </label>
    </div>
  `;
}

function renderImprovementForm(item = null) {
  return `
    <div class="field-grid">
      <label>
        <span class="field-label">Categorie</span>
        <select class="field-select" name="type">
          ${IMPROVEMENT_TYPES.map((type) => `<option value="${type.key}" ${item?.type === type.key ? "selected" : ""}>${escapeHtml(type.label)}</option>`).join("")}
        </select>
      </label>
      <label class="field-span">
        <span class="field-label">Remontee</span>
        <input class="field-input" name="label" type="text" value="${escapeHtml(item?.label ?? "")}">
      </label>
    </div>
  `;
}

function renderClientOptions(selectedClientId = null) {
  return db.clients
    .filter((client) => !isSampleClient(client))
    .map((client) => `<option value="${client.id}" ${Number(selectedClientId) === client.id ? "selected" : ""}>${escapeHtml(client.name)}</option>`)
    .join("");
}

function renderDtfForm(dtf = null) {
  return `
    <div class="field-grid dtf-form-grid">
      <label class="dtf-form-wide">
        <span class="field-label">Client</span>
        <input class="field-input" name="clientName" type="text" list="clientSuggestions" value="${escapeHtml(dtfClientLabel(dtf))}">
      </label>
      <label>
        <span class="field-label">Dimension</span>
        <input class="field-input" name="dimensions" type="text" value="${escapeHtml(dtf?.dimensions ?? "")}">
      </label>
      <label class="dtf-logo-field">
        <span class="field-label">Nom du logo</span>
        <div class="field-stack">
          <input class="field-input" name="designName" type="text" value="${escapeHtml(dtf?.designName ?? "")}" placeholder="Design perso ou logo existant">
          <select class="field-select" name="designPreset">
            ${renderLogoPresetOptions(dtf?.designName)}
          </select>
        </div>
      </label>
      <label>
        <span class="field-label">Taille</span>
        <input class="field-input" name="size" type="text" value="${escapeHtml(dtf?.size ?? "")}">
      </label>
      <label>
        <span class="field-label">Couleur</span>
        <input class="field-input" name="color" type="text" list="dtfColorOptions" value="${escapeHtml(dtf?.color ?? "")}">
      </label>
      <label>
        <span class="field-label">Quantite</span>
        <input class="field-input" name="quantity" type="number" min="1" value="${Math.max(1, Number(dtf?.quantity) || 1)}">
      </label>
      <label>
        <span class="field-label">Type de client</span>
        <select class="field-select" name="clientType">
          <option value="perso" ${(dtf?.clientType ?? "perso") === "perso" ? "selected" : ""}>Perso</option>
          <option value="pro" ${dtf?.clientType === "pro" ? "selected" : ""}>Pro</option>
        </select>
      </label>
      <label class="field-checkbox">
        <span class="field-label">Type de demande</span>
        <span class="checkbox-row">
          <input name="needsMockup" type="checkbox" ${dtf?.needsMockup ? "checked" : ""}>
          <span>Maquette à faire</span>
        </span>
      </label>
      <label class="dtf-form-note">
        <span class="field-label">Note technique</span>
        <input class="field-input" name="technicalNote" type="text" value="${escapeHtml(dtf?.technicalNote ?? "")}">
      </label>
    </div>
    <datalist id="clientSuggestions">${renderClientSuggestionOptions()}</datalist>
    <datalist id="dtfColorOptions">${renderListOptions(TEXTILE_COLOR_OPTIONS)}</datalist>
  `;
}

function renderTextileOrderForm(order = null) {
  return `
    <div class="field-grid textile-form-grid">
      <label>
        <span class="field-label">Client</span>
        <input class="field-input" name="clientName" type="text" list="clientSuggestions" value="${escapeHtml(textileClientLabel(order))}">
      </label>
      <label>
        <span class="field-label">Fournisseur</span>
        <input class="field-input" name="supplier" type="text" list="textileSupplierOptions" value="${escapeHtml(order?.supplier ?? "Toptex")}">
      </label>
      <label>
        <span class="field-label">Marque</span>
        <input class="field-input" name="brand" type="text" list="textileBrandOptions" value="${escapeHtml(order?.brand ?? "")}">
      </label>
      <label>
        <span class="field-label">Genre</span>
        <input class="field-input" name="gender" type="text" list="textileGenderOptions" value="${escapeHtml(order?.gender ?? "-")}">
      </label>
      <label>
        <span class="field-label">Designation</span>
        <input class="field-input" name="designation" type="text" list="textileDesignationOptions" value="${escapeHtml(order?.designation ?? "")}">
      </label>
      <label>
        <span class="field-label">Référence</span>
        <input class="field-input" name="catalogReference" type="text" list="textileReferenceOptions" value="${escapeHtml(order?.catalogReference ?? "")}">
      </label>
      <label>
        <span class="field-label">Couleur</span>
        <input class="field-input" name="color" type="text" list="textileColorOptions" value="${escapeHtml(order?.color ?? "")}">
      </label>
      <label>
        <span class="field-label">Taille</span>
        <input class="field-input" name="size" type="text" list="textileSizeOptions" value="${escapeHtml(order?.size ?? "")}">
      </label>
      <label>
        <span class="field-label">Quantite</span>
        <input class="field-input" name="quantity" type="number" min="1" value="${Math.max(1, Number(order?.quantity) || 1)}">
      </label>
      <label>
        <span class="field-label">Livraison</span>
        <input class="field-input" name="deliveryStatus" type="text" list="textileDeliveryOptions" value="${escapeHtml(order?.deliveryStatus ?? "pending")}">
      </label>
      <label>
        <span class="field-label">Session</span>
        <input class="field-input" name="sessionLabel" type="text" value="${escapeHtml(order?.sessionLabel ?? "")}">
      </label>
      <label>
        <span class="field-label">Date</span>
        <input class="field-input" name="expectedDate" type="date" value="${escapeHtml(order?.expectedDate ?? "")}">
      </label>
    </div>
    <datalist id="clientSuggestions">${renderClientSuggestionOptions()}</datalist>
    <datalist id="textileSupplierOptions">${renderListOptions(TEXTILE_SUPPLIER_OPTIONS)}</datalist>
    <datalist id="textileBrandOptions">${renderTextileValueOptions("brand", TEXTILE_BRAND_OPTIONS)}</datalist>
    <datalist id="textileGenderOptions">${renderListOptions(TEXTILE_GENDER_OPTIONS)}</datalist>
    <datalist id="textileDesignationOptions">${renderTextileValueOptions("designation")}</datalist>
    <datalist id="textileReferenceOptions">${renderTextileValueOptions("catalogReference")}</datalist>
    <datalist id="textileColorOptions">${renderTextileValueOptions("color", TEXTILE_COLOR_OPTIONS)}</datalist>
    <datalist id="textileSizeOptions">${renderTextileValueOptions("size")}</datalist>
    <datalist id="textileDeliveryOptions">${renderListOptions(TEXTILE_DELIVERY_OPTIONS)}</datalist>
  `;
}

function renderClientSuggestionOptions() {
  return db.clients
    .filter((client) => !isSampleClient(client))
    .map((client) => `<option value="${escapeHtml(client.name)}"></option>`)
    .join("");
}

function renderTestPlanningClientSuggestionOptions() {
  return db.clients
    .filter((client) => !isSampleClient(client))
    .map((client) => `<option value="${escapeHtml(String(client.name ?? "").toUpperCase())}"></option>`)
    .join("");
}

function primaryClientContact(client) {
  return client?.contacts?.[0] ?? { name: "", role: "", phone: "", email: "" };
}

function renderClientForm(client = null) {
  const contact = primaryClientContact(client);
  return `
    <div class="field-grid client-form-grid">
      <label>
        <span class="field-label">Société</span>
        <input class="field-input" name="name" type="text" value="${escapeHtml(client?.name ?? "")}">
      </label>
      <label>
        <span class="field-label">Ville</span>
        <input class="field-input" name="city" type="text" value="${escapeHtml(client?.city ?? "")}">
      </label>
      <label>
        <span class="field-label">Code postal</span>
        <input class="field-input" name="postalCode" type="text" value="${escapeHtml(client?.postalCode ?? "")}">
      </label>
      <label>
        <span class="field-label">Contact</span>
        <input class="field-input" name="contactName" type="text" value="${escapeHtml(contact.name ?? "")}">
      </label>
      <label>
        <span class="field-label">Téléphone</span>
        <input class="field-input" name="contactPhone" type="tel" value="${escapeHtml(contact.phone ?? "")}">
      </label>
      <label class="client-form-wide">
        <span class="field-label">Email</span>
        <input class="field-input" name="contactEmail" type="email" value="${escapeHtml(contact.email ?? "")}">
      </label>
    </div>
  `;
}

function renderTestPlanningClientTypeChoices(selectedType = "") {
  const current = String(selectedType ?? "").trim().toUpperCase();
  return ["PRO", "PERSO"].map((type) => `
    <label class="team-bubble-choice" aria-label="Client ${type}">
      <input class="team-bubble-choice-input" type="radio" name="clientType" value="${type}" ${current === type ? "checked" : ""}>
      <span class="team-bubble ${current === type ? "is-active" : ""}">${type}</span>
    </label>
  `).join("");
}

function renderTestPlanningForm(item = null) {
  const stage = normalizeTestPlanningStage(item?.stage);
  return `
    <div class="test-planning-field-stage">
      <span class="field-label">Étape</span>
      <select class="field-select" name="stage">
        ${TEST_PLANNING_STAGES.map((entry) => `<option value="${entry.key}" ${entry.key === stage ? "selected" : ""}>${escapeHtml(entry.label)}</option>`).join("")}
      </select>
    </div>
    <div class="field-grid test-planning-form-grid">
      <label class="test-planning-field-type">
        <span class="field-label">Type</span>
        <span class="team-bubble-group" aria-label="Type de client test planning">
          ${renderTestPlanningClientTypeChoices(item?.clientType)}
        </span>
      </label>
      <label class="test-planning-field-client">
        <span class="field-label">Client</span>
        <div class="autocomplete-wrap">
          <input class="field-input" name="clientName" type="text" autocomplete="off" value="${escapeHtml(item?.clientName ?? "")}" placeholder="CLIENT" data-autocomplete="testPlanningClient">
          <div class="autocomplete-dropdown" id="testPlanningClientDropdown" hidden></div>
        </div>
      </label>
      <label class="test-planning-field-family">
        <span class="field-label">Famille</span>
        <input class="field-input" name="family" type="text" list="testPlanningFamilyOptions" value="${escapeHtml(item?.family ?? "")}" placeholder="Famille">
      </label>
      <label class="test-planning-field-product">
        <span class="field-label">Produit</span>
        <input class="field-input" name="product" type="text" list="testPlanningProductOptions" value="${escapeHtml(item?.product ?? "")}" placeholder="Produit">
      </label>
      <label class="test-planning-field-quantity">
        <span class="field-label">Qté</span>
        <input class="field-input" name="quantity" type="text" value="${escapeHtml(item?.quantity ?? "")}" placeholder="Qté">
      </label>
      <label class="test-planning-field-delivery">
        <span class="field-label">Date de livraison</span>
        <input class="field-input" name="deliveryDate" type="date" value="${escapeHtml(item?.deliveryDate ?? "")}">
      </label>
      <label class="test-planning-field-mockup-toggle">
        <span class="field-label">Maquette à faire</span>
        <span class="checkbox-row">
          <input name="needsMockup" type="checkbox" ${item?.needsMockup ? "checked" : ""}>
          <span>Activer</span>
        </span>
      </label>
      <label class="test-planning-field-status">
        <span class="field-label">État</span>
        <select class="field-select" name="status">
          <option value="">— Choisir un état —</option>
          ${renderTestPlanningStatusOptgroups(item?.status ?? "")}
        </select>
      </label>
      <label class="order-form-note">
        <span class="field-label">Note</span>
        <input class="field-input" name="note" type="text" value="${escapeHtml(item?.note ?? "")}" placeholder="Note">
      </label>
      <label class="test-planning-field-assignee">
        <span class="field-label">Assigné</span>
        <span class="team-bubble-group" aria-label="Assignation test planning">
          ${(() => {
            const current = normalizeImportedAssignee(item?.assignedTo);
            return ORDER_ASSIGNEES.map((assignee) => `
    <label class="team-bubble-choice" aria-label="Assigner a ${assignee}">
      <input class="team-bubble-choice-input" type="radio" name="assignedTo" value="${assignee}" ${current === assignee ? "checked" : ""}>
      <span class="team-bubble ${current === assignee ? "is-active" : ""}">${assignee}</span>
    </label>
  `).join("");
          })()}
        </span>
      </label>
    </div>
    <datalist id="testPlanningFamilyOptions">${renderListOptions(testPlanningCombinedOptions("family", TEST_PLANNING_FAMILY_OPTIONS))}</datalist>
    <datalist id="testPlanningProductOptions">${renderListOptions(testPlanningCombinedOptions("product", TEST_PLANNING_PRODUCT_OPTIONS))}</datalist>
    <!-- status is now a <select> with optgroups -->
  `;
}

function getVisibleClients() {
  const visibleIds = new Set(getVisibleClientRows().map((row) => row.client.id));
  return db.clients.filter((client) => visibleIds.has(client.id));
}

function getVisibleClientRows() {
  const query = state.search;
  const rows = [];

  db.clients.forEach((client) => {
    if (isSampleClient(client)) {
      return;
    }

    const contacts = client.contacts?.length
      ? client.contacts
      : [{ id: 1, name: "", role: "", phone: "", email: "" }];

    contacts.forEach((contact, index) => {
      const haystack = [
        client.name,
        client.clientType,
        client.postalCode,
        client.city,
        contact.name,
        contact.role,
        contact.email,
        contact.phone
      ]
        .join(" ")
        .toLowerCase();

      if (!query || haystack.includes(query)) {
        rows.push({
          client,
          contact: {
            id: contact.id ?? index + 1,
            name: contact.name ?? "",
            role: contact.role ?? "",
            phone: contact.phone ?? "",
            email: contact.email ?? ""
          }
        });
      }
    });
  });

  return rows;
}

function getVisibleProductionItems() {
  if (!state.search) {
    return [...db.productionItems];
  }

  return db.productionItems.filter((item) => [
    item.label,
    item.status,
    item.errorNote
  ].join(" ").toLowerCase().includes(state.search));
}

function countProductionByStatus(status, collection = db.productionItems) {
  return collection.filter((item) => item.status === status).length;
}

function sumProductionQuantity(collection) {
  return collection.reduce((sum, item) => sum + getProductionQuantity(item), 0);
}

function getProductionQuantity(item) {
  return Array.isArray(item?.prints) && item.prints.length
    ? item.prints.length
    : Math.max(1, Number(item?.quantity) || 1);
}

function getProductionCompletedCount(item) {
  return Array.isArray(item?.prints)
    ? item.prints.filter((print) => print.checked).length
    : 0;
}

function getVisibleTeamNotes() {
  if (!state.search) {
    return db.teamNotes;
  }

  return db.teamNotes.filter((note) => [
    note.name,
    note.summary,
    ...note.items.map((item) => item.label)
  ].join(" ").toLowerCase().includes(state.search));
}

function getVisibleTeamNoteItems(note) {
  if (!state.search) {
    return note.items;
  }

  if (`${note.name} ${note.summary}`.toLowerCase().includes(state.search)) {
    return note.items;
  }

  return note.items.filter((item) => `${note.name} ${item.label}`.toLowerCase().includes(state.search));
}

function getVisibleDtfItems() {
  return db.dtfRequests.filter((item) => {
    if (state.showDtfArchives && !item.archivedAt) {
      return false;
    }

    if (!state.showDtfArchives && item.archivedAt) {
      return false;
    }

    if (!state.search) {
      return true;
    }

    const haystack = [
      dtfClientLabel(item),
      item.designName,
      item.dimensions,
      item.logoPlacement,
      item.size,
      item.color,
      item.technicalNote
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(state.search);
  });
}

function getVisibleMockupItems() {
  const rows = [];

  db.dtfRequests.forEach((item) => {
    if (state.showDtfArchives && !item.archivedAt) {
      return;
    }

    if (!state.showDtfArchives && item.archivedAt) {
      return;
    }

    if (!item.needsMockup || item.mockupCompletedAt) {
      return;
    }

    const row = {
      kind: "dtf",
      id: item.id,
      client: dtfClientLabel(item),
      title: item.designName || item.technicalNote || "Demande DTF",
      meta: [item.dimensions, item.logoPlacement, item.color, item.size].filter(Boolean).join(" · "),
      quantity: item.quantity,
      zone: "DTF",
      date: item.createdAt
    };

    if (state.search && !mockupSearchHaystack(row).includes(state.search)) {
      return;
    }

    rows.push(row);
  });

  db.testPlanningItems.forEach((item) => {
    if (!item.needsMockup || item.mockupCompletedAt) {
      return;
    }

    const row = {
      kind: "testPlanning",
      id: item.id,
      client: item.clientName || "Client",
      title: [item.family, item.product].filter(Boolean).join(" · ") || "Commandes générales",
      meta: item.note || "",
      quantity: item.quantity ? Number(item.quantity) : 0,
      zone: "Commandes générales",
      date: item.deliveryDate || (item.createdAt ? item.createdAt.slice(0, 10) : "")
    };

    if (state.search && !mockupSearchHaystack(row).includes(state.search)) {
      return;
    }

    rows.push(row);
  });

  return rows.sort((left, right) => {
    const leftTime = mockupSortTime(left.date);
    const rightTime = mockupSortTime(right.date);
    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }
    return left.client.localeCompare(right.client, "fr");
  });
}

function mockupSearchHaystack(row) {
  return [
    row.client,
    row.title,
    row.meta,
    row.zone
  ]
    .join(" ")
    .toLowerCase();
}

function mockupSortTime(value) {
  if (!value) {
    return Number.MAX_SAFE_INTEGER;
  }

  const normalized = String(value).includes("T") ? String(value) : `${value}T00:00:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime();
}

function getVisibleTextileOrders() {
  const rows = db.textileOrders.filter((item) => {
    if (state.showTextileArchives && !item.archivedAt) {
      return false;
    }

    if (!state.showTextileArchives && item.archivedAt) {
      return false;
    }

    if (!state.search) {
      return true;
    }

    const haystack = [
      clientName(item.clientId),
      item.supplier,
      item.brand,
      item.designation,
      item.catalogReference,
      item.sessionLabel
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(state.search);
  });

  return [...rows].sort((left, right) => compareRows(left, right, state.textileSort.key, state.textileSort.direction));
}

function getVisiblePurchaseItems(zone) {
  return db.purchaseItems.filter((item) => {
    if (item.deletedAt) {
      return false;
    }

    if (item.zone !== zone) {
      return false;
    }

    if (!state.search) {
      return true;
    }

    return `${item.zone} ${item.label}`.toLowerCase().includes(state.search);
  });
}

function getVisibleWorkshopTasks(group) {
  return db.workshopTasks.filter((item) => {
    if (item.group !== group) {
      return false;
    }

    if (!state.search) {
      return true;
    }

    return item.label.toLowerCase().includes(state.search);
  });
}

function getVisibleImprovementItems(type) {
  return db.improvementItems.filter((item) => {
    if (item.type !== type) {
      return false;
    }

    if (!state.search) {
      return true;
    }

    return `${improvementTypeLabel(item.type)} ${item.label}`.toLowerCase().includes(state.search);
  });
}

function getVisibleTestPlanningItems(stageKey) {
  return db.testPlanningItems.filter((item) => {
    if (item.stage !== stageKey) {
      return false;
    }
    if (state.activeTestAssignee && item.assignedTo !== state.activeTestAssignee) {
      return false;
    }
    if (!state.search) {
      return true;
    }
    return [
      item.clientName,
      item.family,
      item.product,
      item.quantity,
      item.note,
      item.status,
      item.mockupStatus || ""
    ].join(" ").toLowerCase().includes(state.search);
  });
}

function duplicateDtfItems(ids) {
  let nextCloneId = nextId(db.dtfRequests, db.dtfRequests.length + 10);
  const clones = db.dtfRequests
    .filter((item) => ids.includes(item.id))
    .map((item) => ({
      ...item,
      id: nextCloneId++,
      status: "draft",
      archivedAt: "",
      createdAt: isoToday()
    }));

  db.dtfRequests = [...clones, ...db.dtfRequests];
  persistDb();
  state.selectedDtfIds.clear();
  requestRender();
  showToast("Demande DTF dupliquee.");
}

function updateDtfStatus(ids, status) {
  db.dtfRequests = db.dtfRequests.map((item) => (
    ids.includes(item.id)
      ? { ...item, status }
      : item
  ));
  persistDb();
  state.selectedDtfIds.clear();
  requestRender();
  showToast("Demandes mises a jour.");
}

function archiveDtfItems(ids, shouldArchive) {
  db.dtfRequests = db.dtfRequests.map((item) => (
    ids.includes(item.id)
      ? { ...item, status: shouldArchive ? item.status : "draft", archivedAt: shouldArchive ? isoToday() : "" }
      : item
  ));
  persistDb();
  state.selectedDtfIds.clear();
  requestRender();
  showToast(shouldArchive ? "Demandes archivees." : "Demandes restaurees.");
}

function deleteDtfItems(ids) {
  db.dtfRequests = db.dtfRequests.filter((item) => !ids.includes(item.id));
  persistDb();
  state.selectedDtfIds.clear();
  requestRender();
  showToast("Demandes supprimees.");
}

function archiveTextileOrder(id, shouldArchive) {
  db.textileOrders = db.textileOrders.map((item) => (
    item.id === id ? { ...item, archivedAt: shouldArchive ? isoToday() : "" } : item
  ));
  persistDb();
  requestRender();
  showToast(shouldArchive ? "Commande textile archivee." : "Commande textile restauree.");
}

function toggleTextileSort(key) {
  if (state.textileSort.key === key) {
    state.textileSort.direction = state.textileSort.direction === "asc" ? "desc" : "asc";
  } else {
    state.textileSort.key = key;
    state.textileSort.direction = key === "expectedDate" ? "asc" : "desc";
  }
}

function compareRows(left, right, key, direction) {
  const factor = direction === "asc" ? 1 : -1;
  const leftValue = key === "client" ? textileClientLabel(left) : left[key];
  const rightValue = key === "client" ? textileClientLabel(right) : right[key];

  if (typeof leftValue === "number" && typeof rightValue === "number") {
    return (leftValue - rightValue) * factor;
  }

  return String(leftValue).localeCompare(String(rightValue), "fr") * factor;
}

function normalizeTextileOrder(item) {
  const deliveryStatus = String(item?.deliveryStatus ?? "").trim();
  return {
    ...item,
    clientId: Number(item?.clientId) || null,
    clientName: String(item?.clientName ?? "").trim(),
    supplier: String(item?.supplier ?? "").trim(),
    brand: String(item?.brand ?? "").trim(),
    gender: String(item?.gender ?? "").trim(),
    designation: String(item?.designation ?? "").trim(),
    catalogReference: String(item?.catalogReference ?? "").trim(),
    color: String(item?.color ?? "").trim(),
    size: String(item?.size ?? "").trim(),
    quantity: Math.max(1, Number(item?.quantity) || 1),
    deliveryStatus: TEXTILE_DELIVERY_OPTIONS.includes(deliveryStatus) ? deliveryStatus : "pending",
    sessionLabel: String(item?.sessionLabel ?? "").trim(),
    expectedDate: String(item?.expectedDate ?? isoToday()),
    archivedAt: String(item?.archivedAt ?? ""),
    createdAt: String(item?.createdAt ?? isoToday())
  };
}

function injectImportedTextileOrders(collection, clients, parsedVersion) {
  if (parsedVersion >= DATA_VERSION) {
    return collection;
  }

  const orders = deepClone(Array.isArray(collection) ? collection : []);
  const clientByName = new Map(
    (Array.isArray(clients) ? clients : []).map((client) => [normalizeClientKey(client?.name), client.id])
  );
  const signatures = new Set(orders.map((item) => textileOrderSignature(item, clients)));

  TEXTILE_ORDER_IMPORTS.forEach((item) => {
    const importedOrder = normalizeTextileOrder({
      id: nextId(orders),
      clientId: clientByName.get(normalizeClientKey(item.clientName)) ?? null,
      ...item
    });
    const signature = textileOrderSignature(importedOrder, clients);

    if (signatures.has(signature)) {
      return;
    }

    orders.unshift(importedOrder);
    signatures.add(signature);
  });

  return orders;
}

function textileOrderSignature(item, clients = db.clients) {
  const clientLabel = textileClientLabel(item, clients);
  return [
    normalizeSearchKey(clientLabel),
    normalizeSearchKey(item?.supplier),
    normalizeSearchKey(item?.brand),
    normalizeSearchKey(item?.designation),
    normalizeSearchKey(item?.catalogReference),
    normalizeSearchKey(item?.color),
    normalizeSearchKey(item?.size),
    String(Math.max(1, Number(item?.quantity) || 1)),
    normalizeSearchKey(item?.deliveryStatus),
    normalizeSearchKey(item?.sessionLabel),
    String(item?.expectedDate ?? "")
  ].join("|");
}

function resolveClientName(clientId, clients = db.clients) {
  return (Array.isArray(clients) ? clients : []).find((client) => client.id === Number(clientId))?.name ?? "";
}

function textileClientLabel(item, clients = db.clients) {
  return String(item?.clientName ?? "").trim() || resolveClientName(item?.clientId, clients) || "Client inconnu";
}

function loadDb() {
  try {
    const candidates = getStoredDbCandidates();
    if (!candidates.length) {
      return {
        data: buildSeedDb(),
        recoveryMessage: "",
        source: "seed"
      };
    }

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate.raw);
        return {
          data: normalizeDb(parsed),
          recoveryMessage: recoveryMessageForStorageSource(candidate.source),
          source: candidate.source
        };
      } catch {
        continue;
      }
    }

    backupCorruptedStorage();
    return {
      data: buildSeedDb(),
      recoveryMessage: "Donnees locales invalides detectees. Une sauvegarde brute a ete preservee.",
      source: "seed"
    };
  } catch {
    backupCorruptedStorage();
    return {
      data: buildSeedDb(),
      recoveryMessage: "Donnees locales invalides detectees. Une sauvegarde brute a ete preservee.",
      source: "seed"
    };
  }
}

function buildSeedDb() {
  const clients = mergeImportedClients(deepClone(seed.clients));
  return {
    ...deepClone(seed),
    clients,
    textileOrders: injectImportedTextileOrders(deepClone(seed.textileOrders), clients, 0),
    purchaseItems: mergePurchaseDefaults(deepClone(seed.purchaseItems)),
    workshopTasks: mergeWorkshopDefaults(deepClone(seed.workshopTasks)),
    improvementItems: [],
    testPlanningItems: []
  };
}

function normalizeDb(parsed) {
  const parsedVersion = Number(parsed?._meta?.version) || 0;
  const shouldResetCustomerOrders = parsedVersion > 0 && parsedVersion < 2;
  const clients = mergeImportedClients(Array.isArray(parsed.clients) ? parsed.clients : deepClone(seed.clients));
  const textileOrders = Array.isArray(parsed.textileOrders)
    ? parsed.textileOrders.map(normalizeTextileOrder)
    : deepClone(seed.textileOrders);
  return {
    teamNotes: normalizeTeamNotes(parsed.teamNotes),
    clients,
    dtfRequests: Array.isArray(parsed.dtfRequests) ? parsed.dtfRequests.map(normalizeDtfRequest) : deepClone(seed.dtfRequests),
    textileOrders: injectImportedTextileOrders(textileOrders, clients, parsedVersion),
    purchaseItems: mergePurchaseDefaults(Array.isArray(parsed.purchaseItems) ? parsed.purchaseItems : deepClone(seed.purchaseItems)),
    productionItems: Array.isArray(parsed.productionItems) ? parsed.productionItems.map(normalizeProductionItem) : deepClone(seed.productionItems),
    workshopTasks: mergeWorkshopDefaults(Array.isArray(parsed.workshopTasks) ? parsed.workshopTasks : deepClone(seed.workshopTasks)),
    improvementItems: Array.isArray(parsed.improvementItems) ? parsed.improvementItems.map(normalizeImprovementItem).filter((item) => item.label) : [],
    testPlanningItems: Array.isArray(parsed.testPlanningItems) ? parsed.testPlanningItems.map(normalizeTestPlanningItem) : []
  };
}

function mergeImportedClients(collection) {
  const clients = deepClone(Array.isArray(collection) ? collection : []);
  const byName = new Map();

  clients.forEach((client) => {
    const key = normalizeClientKey(client?.name);
    if (key) {
      byName.set(key, client);
    }
  });

  for (const importedClient of IMPORTED_PRO_CLIENTS) {
    const key = normalizeClientKey(importedClient.name);
    const existingClient = byName.get(key);

    if (existingClient) {
      existingClient.clientType = existingClient.clientType || importedClient.clientType;
      existingClient.postalCode = existingClient.postalCode || importedClient.postalCode;
      existingClient.city = existingClient.city || importedClient.city;
      existingClient.createdAt = existingClient.createdAt || importedClient.createdAt;
      existingClient.contacts = mergeClientContacts(existingClient.contacts, importedClient.contacts);
      continue;
    }

    clients.push({
      id: nextId(clients),
      name: importedClient.name,
      clientType: importedClient.clientType,
      postalCode: importedClient.postalCode,
      city: importedClient.city,
      createdAt: importedClient.createdAt,
      contacts: importedClient.contacts.map((contact, index) => ({
        id: index + 1,
        name: contact.name,
        role: contact.role,
        phone: contact.phone,
        email: contact.email
      }))
    });
  }

  return clients;
}

function mergeClientContacts(existingContacts, importedContacts) {
  const contacts = Array.isArray(existingContacts) ? existingContacts.slice() : [];
  const seen = new Set(contacts.map((contact) => normalizeContactKey(contact)));

  for (const contact of importedContacts) {
    const key = normalizeContactKey(contact);
    if (!key || seen.has(key)) {
      continue;
    }

    contacts.push({
      id: nextId(contacts),
      name: contact.name,
      role: contact.role,
      phone: contact.phone,
      email: contact.email
    });
    seen.add(key);
  }

  return contacts;
}

function normalizeClientKey(value) {
  return normalizeSearchKey(value);
}

function normalizeContactKey(contact) {
  return [
    normalizeSearchKey(contact?.name),
    normalizeSearchKey(contact?.role),
    normalizeSearchKey(contact?.phone),
    normalizeSearchKey(contact?.email)
  ].filter(Boolean).join("|");
}

function normalizeSearchKey(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getStoredDbCandidates() {
  const candidates = [];
  const primaryRaw = localStorage.getItem(STORAGE_KEY);
  const mirrorRaw = localStorage.getItem(STORAGE_MIRROR_KEY);

  if (primaryRaw) {
    candidates.push({ source: "primary", raw: primaryRaw });
  }

  if (mirrorRaw) {
    candidates.push({ source: "mirror", raw: mirrorRaw });
  }

  readStorageBackups()
    .slice()
    .reverse()
    .forEach((entry) => {
      if (entry?.payload) {
        candidates.push({ source: "backup", raw: entry.payload });
      }
    });

  return candidates;
}

function recoveryMessageForStorageSource(source) {
  if (source === "mirror") {
    return "Le stockage principal etait indisponible. La derniere copie locale miroir a ete restauree.";
  }

  if (source === "backup") {
    return "Le stockage principal etait indisponible. Une sauvegarde locale recente a ete restauree.";
  }

  return "";
}

function normalizeTeamNotes(collection) {
  const rows = Array.isArray(collection) ? collection : deepClone(seed.teamNotes);

  return TEAM_NOTE_MEMBERS.map((name, index) => {
    const existing = rows.find((item) => String(item.name ?? "").trim().toLowerCase() === name.toLowerCase());
    const items = Array.isArray(existing?.items)
      ? existing.items
      : String(existing?.body ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((label, itemIndex) => ({
          id: itemIndex + 1,
          label,
          checked: false
        }));

    const normalizedItems = items.map((item, itemIndex) => ({
      id: Number(item.id) || itemIndex + 1,
      label: String(item.label ?? "").trim(),
      checked: Boolean(item.checked)
    })).filter((item) => item.label);

    const fallbackItems = normalizedItems.length
      ? normalizedItems
      : (TEAM_NOTE_DEFAULT_ITEMS[name] ?? []).map((label, itemIndex) => ({
          id: itemIndex + 1,
          label,
          checked: false
        }));

    const mergedItems = name === "Loic"
      ? mergeMissingTeamNoteItems(fallbackItems, TEAM_NOTE_DEFAULT_ITEMS.Loic ?? [])
      : fallbackItems;

    return {
      id: index + 1,
      name,
      summary: String(existing?.summary ?? "").trim(),
      items: mergedItems,
      updatedAt: String(existing?.updatedAt ?? "") || (mergedItems.length ? isoToday() : "")
    };
  });
}

function mergeMissingTeamNoteItems(items, defaults) {
  const existingLabels = new Set(items.map((item) => String(item.label ?? "").trim().toLowerCase()));
  const merged = [...items];
  let nextItemId = nextId(items);

  defaults.forEach((label) => {
    const normalizedLabel = String(label ?? "").trim();
    if (!normalizedLabel || existingLabels.has(normalizedLabel.toLowerCase())) {
      return;
    }

    merged.push({
      id: nextItemId++,
      label: normalizedLabel,
      checked: false
    });
  });

  return merged;
}

function teamNoteEditKey(noteId, itemId) {
  return `${noteId}:${itemId}`;
}

function startEditingTeamNoteItem(noteId, itemId) {
  state.activeTeamNoteEdit = teamNoteEditKey(noteId, itemId);
  requestRender({ header: false, status: false, view: true });
  requestAnimationFrame(() => {
    const input = refs.viewRoot.querySelector(`.team-note-edit-input[data-note-id="${noteId}"][data-item-id="${itemId}"]`);
    if (input) {
      autosizeTextarea(input);
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  });
}

function saveTeamNoteItem(noteId, itemId, nextLabel) {
  const note = db.teamNotes.find((item) => item.id === noteId);
  const entry = note?.items.find((item) => item.id === itemId);
  if (!entry) {
    state.activeTeamNoteEdit = null;
    requestRender({ header: false, status: false, view: true });
    return;
  }

  const label = String(nextLabel ?? "").trim();
  state.activeTeamNoteEdit = null;

  if (!label || label === entry.label) {
    requestRender({ header: false, status: false, view: true });
    return;
  }

  entry.label = label;
  note.updatedAt = isoToday();
  persistDb();
  requestRender({ header: false, status: true, view: true });
}

function syncTeamNoteItemInput(noteId, itemId, nextLabel) {
  const note = db.teamNotes.find((item) => item.id === noteId);
  const entry = note?.items.find((item) => item.id === itemId);
  const label = String(nextLabel ?? "");

  if (!entry || !label.trim() || entry.label === label) {
    return;
  }

  entry.label = label;
  note.updatedAt = isoToday();
  persistDb();
}

function syncTeamNoteSummary(noteId, nextSummary) {
  const note = db.teamNotes.find((item) => item.id === noteId);
  const summary = String(nextSummary ?? "");

  if (!note || note.summary === summary) {
    return;
  }

  note.summary = summary;
  note.updatedAt = isoToday();
  persistDb();
}

function autosizeTextarea(textarea) {
  if (!(textarea instanceof HTMLTextAreaElement)) {
    return;
  }

  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

function syncTeamNoteEditors() {
  refs.viewRoot.querySelectorAll(".team-note-edit-input, .team-note-summary-input").forEach((node) => {
    autosizeTextarea(node);
  });
}

function normalizeDtfRequest(item) {
  const legacyDimensions = String(item.dimensions ?? "").trim();
  const legacyFront = String(item.dimensionFront ?? "").trim();
  const legacyBack = String(item.dimensionBack ?? "").trim();
  return {
    id: Number(item.id),
    sourceOrderId: Number(item.sourceOrderId) || null,
    clientId: Number(item.clientId) || null,
    clientName: String(item.clientName ?? "").trim(),
    dimensions: legacyDimensions || legacyFront || legacyBack,
    logoPlacement: normalizeLogoPlacement(item.logoPlacement || (legacyBack && !legacyFront ? "AR" : "AV")),
    designName: String(item.designName ?? ""),
    size: String(item.size ?? ""),
    color: String(item.color ?? ""),
    technicalNote: String(item.technicalNote ?? ""),
    quantity: Math.max(1, Number(item.quantity) || 1),
    needsMockup: Boolean(item.needsMockup),
    mockupCompletedAt: String(item.mockupCompletedAt ?? ""),
    clientType: String(item.clientType ?? "perso"),
    status: String(item.status ?? "draft"),
    archivedAt: String(item.archivedAt ?? ""),
    createdAt: String(item.createdAt ?? isoToday())
  };
}

function normalizeProductionItem(item) {
  const quantity = Math.max(1, Number(item.quantity) || 1);
  const rawPrints = Array.isArray(item.prints)
    ? item.prints
    : Array.from({ length: quantity }, (_, index) => ({
        id: index + 1,
        checked: false
      }));

  return {
    id: Number(item.id),
    clientType: String(item.clientType ?? "perso"),
    label: String(item.label ?? item.name ?? "").trim(),
    reference: String(item.reference ?? "").trim(),
    size: String(item.size ?? "").trim(),
    prints: rawPrints.map((print, index) => ({
      id: Number(print.id) || index + 1,
      checked: Boolean(print.checked)
    })),
    status: normalizeProductionStatus(item.status),
    errorNote: String(item.errorNote ?? item.error ?? "").trim(),
    createdAt: String(item.createdAt ?? isoNow()),
    updatedAt: String(item.updatedAt ?? item.createdAt ?? isoNow())
  };
}

function normalizeWorkshopTask(item, index = 0) {
  return {
    id: Number(item.id) || index + 1,
    group: String(item.group ?? "standard"),
    label: String(item.label ?? "").trim(),
    checked: Boolean(item.checked),
    recurring: Boolean(item.recurring),
    createdAt: String(item.createdAt ?? isoToday())
  };
}

function normalizeImprovementItem(item, index = 0) {
  const type = String(item.type ?? "bug");
  return {
    id: Number(item.id) || index + 1,
    type: IMPROVEMENT_TYPES.some((entry) => entry.key === type) ? type : "bug",
    label: String(item.label ?? "").trim(),
    createdAt: String(item.createdAt ?? isoToday())
  };
}

function normalizeTestPlanningItem(item, index = 0) {
  const stage = normalizeTestPlanningStage(item.stage);
  return {
    id: Number(item.id) || index + 1,
    clientType: String(item.clientType ?? "").trim().toUpperCase(),
    clientId: Number(item.clientId) || null,
    clientName: String(item.clientName ?? "").trim().toUpperCase(),
    family: String(item.family ?? "").trim().toUpperCase(),
    product: String(item.product ?? "").trim().toUpperCase(),
    quantity: String(item.quantity ?? "").trim(),
    note: String(item.note ?? "").trim(),
    deliveryDate: String(item.deliveryDate ?? "").trim(),
    needsMockup: Boolean(item.needsMockup),
    mockupStatus: String(item.mockupStatus ?? "").trim(),
    mockupCompletedAt: String(item.mockupCompletedAt ?? ""),
    status: String(item.status ?? "").trim(),
    stage,
    assignedTo: normalizeImportedAssignee(item.assignedTo),
    createdAt: String(item.createdAt ?? isoNow())
  };
}

function mergeWorkshopDefaults(collection) {
  const tasks = (Array.isArray(collection) ? collection : [])
    .map((item, index) => normalizeWorkshopTask(item, index))
    .filter((item) => item.label);
  const seen = new Set(tasks.map((item) => `${item.group}|${normalizeSearchKey(item.label)}`));
  let nextTaskId = nextId(tasks);

  DEFAULT_WORKSHOP_TASKS.forEach((task) => {
    const key = `${task.group}|${normalizeSearchKey(task.label)}`;
    if (seen.has(key)) {
      return;
    }

    tasks.push({
      id: nextTaskId++,
      group: task.group,
      label: task.label,
      checked: false,
      recurring: task.recurring,
      createdAt: isoToday()
    });
    seen.add(key);
  });

  return tasks;
}

function normalizePurchaseItem(item, index = 0) {
  return {
    id: Number(item.id) || index + 1,
    zone: String(item.zone ?? "SXM"),
    label: String(item.label ?? "").trim(),
    quantity: Math.max(1, Number(item.quantity) || 1),
    checked: Boolean(item.checked),
    createdAt: String(item.createdAt ?? isoToday()),
    deletedAt: String(item.deletedAt ?? "")
  };
}

function mergePurchaseDefaults(collection) {
  const items = (Array.isArray(collection) ? collection : [])
    .map((item, index) => normalizePurchaseItem(item, index))
    .filter((item) => item.label);
  const seen = new Set(items.map((item) => `${item.zone}|${normalizeSearchKey(item.label)}`));
  let nextPurchaseId = nextId(items);

  DEFAULT_PURCHASE_ITEMS.forEach((item) => {
    const key = `${item.zone}|${normalizeSearchKey(item.label)}`;
    if (seen.has(key)) {
      return;
    }

    items.push({
      id: nextPurchaseId++,
      zone: item.zone,
      label: item.label,
      quantity: 1,
      checked: item.checked,
      createdAt: isoToday()
    });
    seen.add(key);
  });

  return items;
}

function backupCorruptedStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    const backupKey = `${STORAGE_KEY}.corrupt.${Date.now()}`;
    localStorage.setItem(backupKey, raw);
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures and continue with the seed database.
  }
}

function normalizeImportedAssignee(value) {
  const normalized = String(value ?? "").trim().toUpperCase();
  return ORDER_ASSIGNEES.includes(normalized) ? normalized : "";
}

function normalizeProductionStatus(value) {
  const raw = String(value ?? "").trim().toLowerCase();

  if (raw === "impression en cours" || raw === "en cours") {
    return "Impression en cours";
  }
  if (raw === "erreur") {
    return "Erreur";
  }
  if (raw === "termine" || raw === "terminé") {
    return "Terminé";
  }
  return "A imprimer";
}

function buildDbSnapshot() {
  return {
    ...db,
    _meta: {
      version: DATA_VERSION
    }
  };
}

function persistDb(options = {}) {
  try {
    const payload = JSON.stringify(buildDbSnapshot());

    const primarySaved = safeSetStorageItem(STORAGE_KEY, payload);
    const mirrorSaved = safeSetStorageItem(STORAGE_MIRROR_KEY, payload);
    if (!primarySaved || !mirrorSaved) {
      showToast("Sauvegarde locale partielle. Verifie l'espace de stockage du navigateur.");
      if (!options.skipRemote) {
        scheduleRemoteSave();
      }
      return false;
    }

    writeStorageBackup(payload);
    if (!options.skipRemote) {
      scheduleRemoteSave();
    }
    return true;
  } catch (error) {
    console.error(error);
    showToast("Impossible de sauvegarder les donnees localement.");
    return false;
  }
}

function scheduleRemoteSave(options = {}) {
  if (!remoteSyncReady) {
    return;
  }

  pendingRemoteSnapshot = buildDbSnapshot();

  if (remoteSaveTimer) {
    clearTimeout(remoteSaveTimer);
  }

  const delay = options.immediate ? 0 : REMOTE_SAVE_DEBOUNCE_MS;
  remoteSaveTimer = window.setTimeout(() => {
    void flushRemoteSave();
  }, delay);
}

async function flushRemoteSave() {
  if (!remoteSyncReady || remoteSaveInFlight || !pendingRemoteSnapshot) {
    return;
  }

  const snapshot = pendingRemoteSnapshot;
  pendingRemoteSnapshot = null;
  remoteSaveInFlight = true;

  try {
    const response = await fetch(SERVER_DB_ENDPOINT, {
      method: "PUT",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        revision: remoteRevision,
        data: snapshot
      })
    });

    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }

    if (response.status === 409) {
      const record = await response.json();
      remoteRevision = Math.max(0, Number(record.revision) || 0);
      const localSnapshot = buildDbSnapshot();
      applyRemoteDbRecord(record, { announce: false });
      mergeLocalChangesBack(localSnapshot);
      persistDb();
      showToast("Donnees synchronisees avec le serveur.");
      return;
    }

    if (!response.ok) {
      throw new Error(`Remote save failed with status ${response.status}`);
    }

    const record = await response.json();
    remoteRevision = Math.max(0, Number(record.revision) || remoteRevision);
  } catch (error) {
    if (error instanceof TypeError || error instanceof SyntaxError) {
      pendingRemoteSnapshot = snapshot;
    } else {
      console.error(error);
      pendingRemoteSnapshot = snapshot;
      notifyRemoteSyncIssue();
    }
  } finally {
    remoteSaveInFlight = false;

    if (pendingRemoteSnapshot) {
      scheduleRemoteSave({ immediate: true });
    }
  }
}

function mergeLocalChangesBack(localSnapshot) {
  if (!localSnapshot || typeof localSnapshot !== "object") return;

  var collections = [
    "testPlanningItems", "orders", "dtfRequests", "textileOrders",
    "purchaseItems", "workshopTasks", "improvementItems"
  ];

  for (var c = 0; c < collections.length; c++) {
    var key = collections[c];
    var localItems = localSnapshot[key];
    var remoteItems = db[key];
    if (!Array.isArray(localItems) || !Array.isArray(remoteItems)) continue;

    for (var i = 0; i < localItems.length; i++) {
      var localItem = localItems[i];
      if (!localItem || !localItem.id) continue;
      var remoteItem = remoteItems.find(function(r) { return r.id === localItem.id; });

      if (remoteItem) {
        var localUpdated = localItem.updatedAt || localItem.createdAt || "";
        var remoteUpdated = remoteItem.updatedAt || remoteItem.createdAt || "";
        if (localUpdated > remoteUpdated) {
          Object.assign(remoteItem, localItem);
        }
      } else {
        remoteItems.push(localItem);
      }
    }
  }
}

function readStorageBackups() {
  try {
    const raw = localStorage.getItem(STORAGE_BACKUPS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorageBackup(payload) {
  const backups = readStorageBackups();
  backups.push({
    savedAt: isoNow(),
    payload
  });

  safeSetStorageItem(
    STORAGE_BACKUPS_KEY,
    JSON.stringify(backups.slice(-MAX_STORAGE_BACKUPS))
  );
}

function safeSetStorageItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function readSheetDrafts() {
  try {
    const raw = localStorage.getItem(SHEET_DRAFTS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function sheetDraftStorageKey(action, id = null) {
  return `${action}:${id ?? "new"}`;
}

function activeSheetDraftStorageKey() {
  if (!state.activeSheetAction) {
    return "";
  }

  if (state.activeSheetAction === "editDtf") {
    return sheetDraftStorageKey(state.activeSheetAction, state.activeDtfId);
  }

  if (state.activeSheetAction === "editTextileOrder") {
    return sheetDraftStorageKey(state.activeSheetAction, state.activeTextileId);
  }

  if (state.activeSheetAction === "editPurchaseItem") {
    return sheetDraftStorageKey(state.activeSheetAction, state.activePurchaseId);
  }

  if (state.activeSheetAction === "editWorkshopTask") {
    return sheetDraftStorageKey(state.activeSheetAction, state.activeWorkshopTaskId);
  }

  if (state.activeSheetAction === "editImprovementItem") {
    return sheetDraftStorageKey(state.activeSheetAction, state.activeImprovementId);
  }

  if (state.activeSheetAction === "editTestPlanningOrder") {
    return sheetDraftStorageKey(state.activeSheetAction, state.activeTestPlanningId);
  }

  return sheetDraftStorageKey(state.activeSheetAction);
}

function persistSheetDraft() {
  const key = activeSheetDraftStorageKey();
  if (!key) {
    return;
  }

  const draft = serializeSheetForm(refs.sheetForm);
  const drafts = readSheetDrafts();
  drafts[key] = {
    savedAt: isoNow(),
    values: draft
  };
  safeSetStorageItem(SHEET_DRAFTS_KEY, JSON.stringify(drafts));
}

function restoreSheetDraft(action, options = {}) {
  const key = sheetDraftStorageKey(action, options.id ?? null);
  const draft = readSheetDrafts()[key];
  if (!draft?.values) {
    return;
  }

  applySheetDraft(refs.sheetForm, draft.values);
}

function clearSheetDraftByAction(action, id = null) {
  const key = sheetDraftStorageKey(action, id);
  const drafts = readSheetDrafts();
  if (!drafts[key]) {
    return;
  }

  delete drafts[key];
  safeSetStorageItem(SHEET_DRAFTS_KEY, JSON.stringify(drafts));
}

function serializeSheetForm(form) {
  const values = {};
  [...form.elements].forEach((field) => {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) {
      return;
    }

    if (!field.name || field.disabled || field.type === "hidden" || field.type === "submit" || field.type === "button") {
      return;
    }

    if (field instanceof HTMLInputElement && field.type === "checkbox") {
      values[field.name] = field.checked;
      return;
    }

    if (field instanceof HTMLInputElement && field.type === "radio") {
      if (field.checked) {
        values[field.name] = field.value;
      }
      return;
    }

    values[field.name] = field.value;
  });
  return values;
}

function applySheetDraft(form, values) {
  [...form.elements].forEach((field) => {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) {
      return;
    }

    if (!field.name || !(field.name in values)) {
      return;
    }

    if (field instanceof HTMLInputElement && field.type === "checkbox") {
      field.checked = Boolean(values[field.name]);
      return;
    }

    if (field instanceof HTMLInputElement && field.type === "radio") {
      field.checked = field.value === String(values[field.name] ?? "");
      return;
    }

    field.value = String(values[field.name] ?? "");
  });
}

function nextId(collection, start = 1) {
  return collection.reduce((max, item) => Math.max(max, Number(item.id) || 0), start - 1) + 1;
}

function clientName(clientId) {
  return db.clients.find((client) => client.id === clientId)?.name ?? "Client inconnu";
}

function isSampleClient(client) {
  return SAMPLE_CLIENT_NAMES.has(String(client?.name ?? "").trim());
}

function dtfClientLabel(item) {
  if (item?.clientName) {
    return item.clientName;
  }

  if (item?.clientId) {
    return clientName(item.clientId);
  }

  return "Client inconnu";
}

function teamNoteTone(name) {
  const tones = {
    Loic: "cool-1",
    Charlie: "cool-2",
    Melina: "cool-3",
    Amandine: "cool-4"
  };

  return tones[String(name ?? "").trim()] ?? "cool-1";
}


function urgencyTone(urgency) {
  if (urgency === "Haute") {
    return "high";
  }
  if (urgency === "Basse") {
    return "low";
  }
  return "medium";
}

function deadlineTone(offset) {
  if (offset === null) {
    return "muted";
  }
  if (offset < 0) {
    return "late";
  }
  if (offset <= 2) {
    return "soon";
  }
  return "safe";
}

function deadlineCopy(offset) {
  if (offset === 0) {
    return "Aujourd'hui";
  }
  if (offset > 0) {
    return `+${offset}j`;
  }
  return `${offset}j`;
}

function normalizeTestPlanningStage(value) {
  const stage = String(value ?? "").trim();
  return TEST_PLANNING_STAGE_KEYS.includes(stage) ? stage : TEST_PLANNING_DEFAULT_STAGE;
}

function initTestPlanningClientAutocomplete() {
  const input = refs.sheetBody.querySelector('[data-autocomplete="testPlanningClient"]');
  const dropdown = refs.sheetBody.querySelector('#testPlanningClientDropdown');
  if (!input || !dropdown) return;

  const clientNames = db.clients
    .filter((c) => !isSampleClient(c))
    .map((c) => String(c.name ?? "").toUpperCase())
    .filter(Boolean)
    .sort();

  function showSuggestions(query) {
    const q = query.toUpperCase().trim();
    const matches = q
      ? clientNames.filter((n) => n.includes(q))
      : clientNames.slice(0, 40);
    if (!matches.length) { dropdown.hidden = true; return; }
    dropdown.innerHTML = matches
      .map((name) => `<div class="autocomplete-option" tabindex="-1">${escapeHtml(name)}</div>`)
      .join("");
    dropdown.hidden = false;
  }

  function selectOption(name) {
    input.value = name;
    dropdown.hidden = true;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  }

  input.addEventListener("input", () => showSuggestions(input.value));
  input.addEventListener("focus", () => showSuggestions(input.value));
  input.addEventListener("blur", () => { setTimeout(() => { dropdown.hidden = true; }, 150); });

  input.addEventListener("keydown", (e) => {
    if (dropdown.hidden) return;
    const options = [...dropdown.querySelectorAll(".autocomplete-option")];
    if (e.key === "ArrowDown") { e.preventDefault(); options[0]?.focus(); }
    else if (e.key === "Escape") { dropdown.hidden = true; }
  });

  dropdown.addEventListener("mousedown", (e) => {
    const opt = e.target.closest(".autocomplete-option");
    if (!opt) return;
    e.preventDefault();
    selectOption(opt.textContent);
  });

  dropdown.addEventListener("keydown", (e) => {
    const options = [...dropdown.querySelectorAll(".autocomplete-option")];
    const idx = options.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); (options[idx + 1] || options[0])?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); idx <= 0 ? input.focus() : options[idx - 1]?.focus(); }
    else if (e.key === "Enter") { e.preventDefault(); if (idx >= 0) selectOption(options[idx].textContent); }
    else if (e.key === "Escape") { dropdown.hidden = true; input.focus(); }
  });
}

function syncTestPlanningStageField() {
  if (!refs.sheetForm) {
    return;
  }

  const stageField = refs.sheetForm.elements.namedItem("stage");
  const statusField = refs.sheetForm.elements.namedItem("status");
  if (!(stageField instanceof HTMLSelectElement)) {
    return;
  }

  if (statusField instanceof HTMLSelectElement) {
    const currentStatus = statusField.value;
    statusField.innerHTML = '<option value="">— Choisir un état —</option>' + renderTestPlanningStatusOptgroups(currentStatus);
  }
}

function shiftTestPlanningSheetStage(direction) {
  if (!refs.sheetForm) {
    return;
  }

  const stageField = refs.sheetForm.elements.namedItem("stage");
  if (!(stageField instanceof HTMLSelectElement)) {
    return;
  }

  const currentIndex = TEST_PLANNING_STAGE_KEYS.indexOf(stageField.value);
  if (currentIndex === -1) {
    return;
  }

  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= TEST_PLANNING_STAGE_KEYS.length) {
    return;
  }

  stageField.value = TEST_PLANNING_STAGE_KEYS[nextIndex];
  const statusField = refs.sheetForm.elements.namedItem("status");
  if (statusField instanceof HTMLSelectElement) {
    statusField.value = testPlanningDefaultStatus(stageField.value);
  }
  syncTestPlanningStageField();
  persistSheetDraft();
}

function syncTestPlanningMockupField() {
  if (!refs.sheetForm) {
    return;
  }

  const toggle = refs.sheetForm.elements.namedItem("needsMockup");
  const field = refs.sheetForm.elements.namedItem("mockupStatus");
  if (!(toggle instanceof HTMLInputElement) || !(field instanceof HTMLInputElement)) {
    return;
  }

  const fieldLabel = field.closest("label");
  field.disabled = !toggle.checked;
  if (fieldLabel) {
    fieldLabel.hidden = !toggle.checked;
  }
  if (!toggle.checked && !field.value.trim()) {
    field.placeholder = "Non utilisée";
  } else if (!field.value.trim()) {
    field.placeholder = "À faire ou OK";
  }
}

function testPlanningStatusesForStage(stage) {
  const config = TEST_PLANNING_STAGES.find((entry) => entry.key === stage);
  return config ? config.statuses : TEST_PLANNING_STATUS_OPTIONS;
}

function testPlanningDefaultStatus(stage) {
  return testPlanningStatusesForStage(stage)[0] || "";
}

function testPlanningStageForStatus(status) {
  if (!status) return null;
  for (var i = 0; i < TEST_PLANNING_STAGES.length; i++) {
    if (TEST_PLANNING_STAGES[i].statuses.indexOf(status) !== -1) {
      return TEST_PLANNING_STAGES[i].key;
    }
  }
  return null;
}

function renderTestPlanningStatusOptgroups(selectedValue) {
  return TEST_PLANNING_STAGES.map(function(stage) {
    var opts = stage.statuses.map(function(s) {
      var sel = s === selectedValue ? " selected" : "";
      return '<option value="' + escapeHtml(s) + '"' + sel + '>' + escapeHtml(s) + '</option>';
    }).join("");
    return '<optgroup label="' + escapeHtml(stage.label) + '">' + opts + '</optgroup>';
  }).join("");
}

function handleInlineStatusEvent(sel) {
  var itemId = Number(sel.dataset.inlineStatusSel);
  var item = db.testPlanningItems.find(function(e) { return e.id === itemId; });
  if (!item) return;
  var newStatus = sel.value;
  item.status = newStatus;
  var targetStage = testPlanningStageForStatus(newStatus);
  if (targetStage && targetStage !== item.stage) {
    item.stage = targetStage;
  }
  item.updatedAt = isoNow();
  persistDb();
  requestRender({ header: false, status: false, view: true });
}

function testPlanningCombinedOptions(key, defaults) {
  defaults = defaults || [];
  var values = [];
  var i;
  for (i = 0; i < defaults.length; i++) {
    if (defaults[i] && values.indexOf(defaults[i]) === -1) {
      values.push(defaults[i]);
    }
  }
  var items = db.testPlanningItems || [];
  for (i = 0; i < items.length; i++) {
    var value = String(items[i] && items[i][key] != null ? items[i][key] : "").trim();
    if (value && values.indexOf(value) === -1) {
      values.push(value);
    }
  }
  return values;
}

function normalizeLogoPlacement(value) {
  return String(value ?? "").trim().toUpperCase() === "AR" ? "AR" : "AV";
}

function dtfLabel(status) {
  if (status === "validated") {
    return "Validee";
  }
  if (status === "archived") {
    return "Archivee";
  }
  if (status === "done") {
    return "Terminee";
  }
  return "Brouillon";
}

function dtfTone(status) {
  if (status === "validated") {
    return "progress";
  }
  if (status === "done") {
    return "ready";
  }
  if (status === "archived") {
    return "draft";
  }
  return "draft";
}

function deliveryTone(status) {
  if (status === "received") {
    return "received";
  }
  if (status === "maritime") {
    return "transit";
  }
  return "pending";
}

function productionTone(status) {
  if (status === "Terminé") {
    return "ready";
  }
  if (status === "Erreur") {
    return "urgent";
  }
  if (status === "Impression en cours") {
    return "progress";
  }
  return "draft";
}

function renderProductionStatusOptions(selectedStatus = PRODUCTION_STATUS_DEFAULT) {
  return PRODUCTION_STATUS_OPTIONS.map((status) => `
    <option value="${escapeHtml(status)}" ${status === selectedStatus ? "selected" : ""}>${escapeHtml(status)}</option>
  `).join("");
}

function renderSelectOptions(options, selectedValue) {
  return options.map((option) => `
    <option value="${escapeHtml(option)}" ${option === selectedValue ? "selected" : ""}>${escapeHtml(option)}</option>
  `).join("");
}

function renderListOptions(options) {
  return options
    .filter(Boolean)
    .map((option) => `<option value="${escapeHtml(String(option))}"></option>`)
    .join("");
}

function improvementTypeLabel(type) {
  return IMPROVEMENT_TYPES.find((item) => item.key === type)?.label ?? "Bug";
}

function renderLogoPresetOptions(selectedValue = "") {
  const current = String(selectedValue ?? "").trim();
  const knownValues = new Set([...FRONT_LOGO_OPTIONS, ...BACK_LOGO_OPTIONS]);
  const customOption = current && !knownValues.has(current)
    ? `<option value="${escapeHtml(current)}" selected>${escapeHtml(current)}</option>`
    : `<option value="" ${current ? "" : "selected"}>Choisir</option>`;

  return `
    ${customOption}
    <optgroup label="Avant">
      ${FRONT_LOGO_OPTIONS.map((option) => `<option value="${escapeHtml(option)}" ${option === current ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
    </optgroup>
    <optgroup label="Arriere">
      ${BACK_LOGO_OPTIONS.map((option) => `<option value="${escapeHtml(option)}" ${option === current ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
    </optgroup>
  `;
}

function inferLogoPlacement(designName, fallback = "AV") {
  const current = String(designName ?? "").trim();
  if (FRONT_LOGO_OPTIONS.includes(current)) {
    return "AV";
  }
  if (BACK_LOGO_OPTIONS.includes(current)) {
    return "AR";
  }
  return normalizeLogoPlacement(fallback);
}

function renderTextileValueOptions(key, baseOptions = []) {
  const values = new Set(baseOptions.filter(Boolean).map((option) => String(option).trim()));

  db.textileOrders.forEach((item) => {
    const value = String(item?.[key] ?? "").trim();
    if (value) {
      values.add(value);
    }
  });

  return [...values]
    .sort((left, right) => left.localeCompare(right, "fr"))
    .map((value) => `<option value="${escapeHtml(value)}"></option>`)
    .join("");
}

function parseOrderClient(value) {
  const raw = String(value ?? "").trim();
  const matchedClient = db.clients.find((client) => client.name.toLowerCase() === raw.toLowerCase());

  if (matchedClient) {
    return {
      clientId: matchedClient.id,
      clientName: matchedClient.name
    };
  }

  return {
    clientId: null,
    clientName: raw
  };
}

function parseTestPlanningClient(value) {
  const parsed = parseOrderClient(value);
  return {
    clientId: parsed.clientId,
    clientName: String(parsed.clientName ?? "").trim().toUpperCase()
  };
}

function primaryLabel(action) {
  const labels = {
    addClient: "+ Ajouter un client",
    addDtf: "+ Ajouter une demande",
    editDtf: "Modifier la demande",
    addTestPlanningOrder: "+ Ajouter une commande",
    editTestPlanningOrder: "Modifier la commande",
    addTextileOrder: "+ Ajouter une commande",
    editTextileOrder: "Modifier la commande",
    addProductionItem: "+ Ajouter un PRT",
    addPurchaseItem: "+ Ajouter un article",
    editPurchaseItem: "Modifier l'article",
    addWorkshopTask: "+ Ajouter une tâche",
    editWorkshopTask: "Modifier la tâche",
    editImprovementItem: "Modifier la remontée"
  };
  return labels[action] ?? "+ Ajouter";
}

function submitLabel(action) {
  const labels = {
    addClient: "Créer le client",
    addDtf: "Créer la demande",
    editDtf: "Enregistrer",
    addTestPlanningOrder: "Créer la commande",
    editTestPlanningOrder: "Enregistrer",
    addTextileOrder: "Créer la commande",
    editTextileOrder: "Enregistrer",
    addProductionItem: "Ajouter le PRT",
    addPurchaseItem: "Ajouter l'article",
    editPurchaseItem: "Enregistrer",
    addWorkshopTask: "Ajouter la tâche",
    editWorkshopTask: "Enregistrer",
    editImprovementItem: "Enregistrer"
  };
  return labels[action] ?? "Enregistrer";
}

function sheetEyebrow(action) {
  const labels = {
    addClient: "Clients Pro",
    addDtf: "Demande DTF",
    editDtf: "Demande DTF",
    addTestPlanningOrder: "Commandes générales",
    editTestPlanningOrder: "Commandes générales",
    addTextileOrder: "Achat Textile",
    editTextileOrder: "Achat Textile",
    addProductionItem: "Production",
    addPurchaseItem: "Achat",
    editPurchaseItem: "Achat",
    addWorkshopTask: "Gestion d'atelier",
    editWorkshopTask: "Gestion d'atelier",
    editImprovementItem: "Améliorations"
  };
  return labels[action] ?? "Création";
}

function showToast(message) {
  refs.toast.textContent = message;
  refs.toast.hidden = false;

  if (state.toastTimer) {
    clearTimeout(state.toastTimer);
  }

  state.toastTimer = setTimeout(() => {
    refs.toast.hidden = true;
    state.toastTimer = null;
  }, 1800);
}

function formatDate(value) {
  if (!value) {
    return "—";
  }
  try {
    const raw = String(value).trim();
    const dateStr = raw.includes("T") ? raw : `${raw}T00:00:00`;
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      return "—";
    }
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(date);
  } catch (e) {
    return "—";
  }
}

function isoToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isoNow() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function isoMonthPrefix() {
  return isoToday().slice(0, 7);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
