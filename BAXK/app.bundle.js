(() => {
  // BAXK/app.js
  var STORAGE_KEY = "dasholda.erp.v3";
  var STORAGE_MIRROR_KEY = "".concat(STORAGE_KEY, ".mirror");
  var STORAGE_BACKUPS_KEY = "".concat(STORAGE_KEY, ".backups");
  var SHEET_DRAFTS_KEY = "".concat(STORAGE_KEY, ".sheetDrafts");
  var MAX_STORAGE_BACKUPS = 20;
  var DATA_VERSION = 3;
  var SERVER_DB_ENDPOINT = "/api/db";
  var REMOTE_SYNC_INTERVAL_MS = 3e3;
  var REMOTE_SAVE_DEBOUNCE_MS = 500;
  var deepClone = typeof structuredClone === "function" ? (value) => structuredClone(value) : (value) => JSON.parse(JSON.stringify(value));
  var views = {
    tasks: {
      label: "T\xE2ches",
      eyebrow: "T\xE2ches",
      intro: "",
      primaryAction: null,
      searchPlaceholder: "Rechercher dans les notes..."
    },
    testPlanning: {
      label: "Commandes g\xE9n\xE9rales",
      eyebrow: "Commandes g\xE9n\xE9rales",
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
      label: "Maquette \xE0 faire",
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
      label: "Am\xE9liorations",
      eyebrow: "Am\xE9liorations",
      intro: "",
      primaryAction: null,
      searchPlaceholder: "Rechercher..."
    }
  };
  var TEST_PLANNING_STAGES = [
    {
      key: "demande",
      label: "1. Demande",
      shortLabel: "Demande",
      accent: "blue",
      statuses: ["Devis \xE0 faire", "Pas urgent", "Manque information", "Pas de Stock"]
    },
    {
      key: "devis",
      label: "2. Devis en cours",
      shortLabel: "Devis en cours",
      accent: "violet",
      statuses: ["Devis en attente validation", "Modification devis", "Manque information", "Maquette \xE0 faire"]
    },
    {
      key: "accepted",
      label: "3. Devis accept\xE9",
      shortLabel: "Accept\xE9",
      accent: "orange",
      statuses: ["Pr\xE9paration du produit", "Attente Marchandise", "Maquette en cours de validation"]
    },
    {
      key: "production",
      label: "4. Production",
      shortLabel: "Production",
      accent: "green",
      statuses: ["PRT \xE0 faire", "A produire", "En cours", "Manque information"]
    },
    {
      key: "facture",
      label: "5. Factur\xE9",
      shortLabel: "Factur\xE9",
      accent: "rose",
      statuses: ["Commande Termin\xE9", "Client pr\xE9venu", "Commande r\xE9cup\xE9r\xE9"]
    },
    {
      key: "paye",
      label: "6. Pay\xE9",
      shortLabel: "Pay\xE9",
      accent: "cyan",
      statuses: ["Pay\xE9 en boutique", "Pay\xE9 par virement prochainement", "Manque information"]
    },
    {
      key: "archived",
      label: "7. Archiv\xE9",
      shortLabel: "Archiv\xE9",
      accent: "slate",
      statuses: ["Pay\xE9 + Livr\xE9 = Termin\xE9"]
    }
  ];
  var TEST_PLANNING_STAGE_KEYS = TEST_PLANNING_STAGES.map((stage) => stage.key);
  var TEST_PLANNING_DEFAULT_STAGE = TEST_PLANNING_STAGES[0].key;
  var TEST_PLANNING_FAMILY_OPTIONS = ["", "TEXTILES", "TROTEC", "UV", "GOODIES", "AUTRES"];
  var TEST_PLANNING_PRODUCT_OPTIONS = ["", "TSHIRT", "TSHIRT PRO", "SAC", "POCHETTE", "CASQUETTE"];
  var TEST_PLANNING_STATUS_OPTIONS = TEST_PLANNING_STAGES.flatMap((stage) => stage.statuses);
  var PRODUCTION_STATUS_OPTIONS = ["A imprimer", "Impression en cours", "Erreur", "Termin\xE9"];
  var PRODUCTION_STATUS_DEFAULT = "A imprimer";
  var TEAM_NOTE_MEMBERS = ["Loic", "Charlie", "Melina", "Amandine"];
  var IMPROVEMENT_TYPES = [
    { key: "bug", label: "Bug" },
    { key: "problem", label: "Probleme" },
    { key: "request", label: "Modification souhaitee" }
  ];
  var ORDER_ASSIGNEES = ["L", "M", "C", "A", "R"];
  var TEXTILE_COLUMN_DEFINITIONS = [
    { key: "client", label: "Client" },
    { key: "supplier", label: "Fournisseur" },
    { key: "brand", label: "Marque" },
    { key: "gender", label: "Genre" },
    { key: "designation", label: "D\xE9signation" },
    { key: "catalogReference", label: "R\xE9f\xE9rence" },
    { key: "color", label: "Couleur" },
    { key: "size", label: "Taille" },
    { key: "quantity", label: "Qt\xE9" },
    { key: "deliveryStatus", label: "Livraison" },
    { key: "sessionLabel", label: "Session" },
    { key: "expectedDate", label: "Date" }
  ];
  var TEXTILE_SUPPLIER_OPTIONS = ["Toptex", "Wordans"];
  var TEXTILE_BRAND_OPTIONS = ["-", "Native Spirit", "Westford Mill", "Gildan"];
  var TEXTILE_GENDER_OPTIONS = ["-", "Mixte", "Homme", "Femme", "Enfant"];
  var TEXTILE_DELIVERY_OPTIONS = ["pending", "maritime", "received"];
  var TEXTILE_COLOR_OPTIONS = [
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
    "rose b\xE9b\xE9",
    "bleu clair",
    "vert pastel",
    "menthe",
    "jaune",
    "marron",
    "beige",
    "blanc"
  ];
  var FRONT_LOGO_OPTIONS = ["FLE-PI", "PAL-PI", "COEUR-PI", "BEA-16", "TOR-04", "SXM-12 POITRINE", "SXM-20"];
  var BACK_LOGO_OPTIONS = ["PAY-01", "SLO-01", "SXM-24", "COR-04", "COC-03", "GOO-01", "TEQ-01", "SXM-15", "PAL-16", "SXM-23", "VOI-02"];
  var TEXTILE_ORDER_IMPORTS = [
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
      sessionLabel: "\u2014",
      expectedDate: "2026-03-10",
      archivedAt: "",
      createdAt: "2026-03-16"
    }
  ];
  var DEFAULT_PURCHASE_ITEMS = [
    { zone: "SXM", label: "Porte VU", checked: true },
    { zone: "SXM", label: "Sac 50L", checked: false },
    { zone: "SXM", label: "Piles Lithium CR2032", checked: false },
    { zone: "SXM", label: "Glue avec bouton pressoir sur le cot\xE9", checked: false },
    { zone: "Europe", label: "DTF Objets x25 :", checked: false },
    { zone: "Europe", label: "BEA-16 Bleu clair H=50 L=45", checked: false },
    { zone: "Europe", label: "BEA-16 Rose H=50 L=45", checked: false },
    { zone: "Europe", label: "BEA-13 Multi color H=48 L=60", checked: false },
    { zone: "Europe", label: "TOR-04 Blanc H=52 L=49", checked: false },
    { zone: "Europe", label: "DTF Objet x100 : Pas lave vaisselle", checked: false },
    { zone: "Europe", label: "SXM-12 Navy D=50", checked: false }
  ];
  var DEFAULT_WORKSHOP_TASKS = [
    { group: "standard", label: "Laisser 1 Clim a 26\xB0 la nuit (AIRWELL)", recurring: true },
    { group: "standard", label: "Eteindre les multiprises de l'atelier ...", recurring: true },
    { group: "standard", label: "Allumer PC trotec pour syncro drop...", recurring: true },
    { group: "dtf", label: "Vider la colle chaque soir", recurring: true },
    { group: "dtf", label: "Vendredi nettoyage complet", recurring: true },
    { group: "dtf", label: "Checker les quantite d'encre chaqu...", recurring: true },
    { group: "dtf", label: "remettre la protection sur le papier ...", recurring: true },
    { group: "dtf", label: "Changement Papier le 06/03/26", recurring: false }
  ];
  var SAMPLE_CLIENT_NAMES = /* @__PURE__ */ new Set(["Hotel Rive Sud", "Festival Moko", "Maison Ledor"]);
  var IMPORTED_CLIENT_DATE = "2026-03-16";
  var importedContact = (name, role, phone = "", email = "") => ({ name, role, phone, email });
  var IMPORTED_PRO_CLIENTS = [
    { name: "VOILA SXM", clientType: "Boutique", city: "GRAND CASE", contacts: [importedContact("Clara", "Patronne", "0690377241")] },
    { name: "SEA YOU", clientType: "Boutique", city: "GRAND CASE", contacts: [importedContact("Iris", "Patronne", "0690552585")] },
    { name: "BREAD N BUTTER", clientType: "Epicerie", city: "OYSTER POND", contacts: [importedContact("Sandra / Sylvain", "Patrons", "0690333519")] },
    { name: "JOA", clientType: "Restaurant", city: "BAIE ORIENTALE", contacts: [importedContact("Alexandre", "Patron", "0630010339")] },
    { name: "BEACHLIFE", clientType: "Boutique", city: "BAIE ORIENTALE", contacts: [importedContact("Jenni", "Patronne", "0690652190")] },
    { name: "LA PLAYA", clientType: "Hotel", city: "BAIE ORIENTALE", contacts: [importedContact("Caty", "Patronne", "0690279131")] },
    { name: "ORIENT BEACH HOTEL", clientType: "Hotel", city: "BAIE ORIENTALE", contacts: [importedContact("Myriam", "Patronne", "0690629097")] },
    { name: "PIOU", clientType: "Boutique", city: "HOPE ESTATE", contacts: [importedContact("Clara / Iris", "Patronnes")] },
    { name: "NSEA STEM", clientType: "Cr\xE9atrice", city: "SAINT-BARTHELEMY", contacts: [importedContact("Andr\xE9a", "Patronne", "0659318983")] },
    {
      name: "IGUANA FITNESS",
      clientType: "Complexe Sportif",
      city: "GRAND CASE",
      contacts: [
        importedContact("J\xE9r\xF4me", "Patron", "0690662400"),
        importedContact("Pasqualine", "communication", "0677029350")
      ]
    },
    { name: "3SP", clientType: "Entretien", city: "?", contacts: [importedContact("Fabien", "Patron", "0690382769")] },
    { name: "ART FOR SCIENCES", clientType: "Association", city: "HOPE ESTATE", contacts: [importedContact("M\xE9lanie", "Patronne", "0609531462")] },
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
        importedContact("C\xE9dric", "Patron", "0690613009"),
        importedContact("Lucas", "Fr\xE8re du patron & Beach Manager", "0646784546")
      ]
    },
    {
      name: "SIMA",
      clientType: "Agenceur",
      city: "HOPE ESTATE",
      contacts: [
        importedContact("Anais", "femme du g\xE9rant", "0690534369"),
        importedContact("Vincent", "G\xE9rant", "0690543498")
      ]
    },
    { name: "PHARMACIE HOPE ESTATE", clientType: "M\xE9dical", city: "HOPE ESTATE", contacts: [importedContact("Julien", "G\xE9rant", "0690777248")] },
    { name: "LA GAGNE BRASERO", clientType: "Restaurant", city: "-", contacts: [importedContact("Antoine", "G\xE9rant", "0618631726")] },
    { name: "ONE LOVE", clientType: "Boutique", city: "HOPE ESTATE", contacts: [importedContact("Karine", "G\xE9rant", "0690754191")] },
    { name: "KARIBUNI HOTEL", clientType: "Hotel", city: "CUL DE SAC", contacts: [importedContact("Manon", "fille de Gr\xE9ant", "0690643858")] },
    {
      name: "KARIBUNI RESTAURANT",
      clientType: "Restaurant",
      city: "PINEL",
      contacts: [
        importedContact("Marion", "G\xE9rante", "0690613851"),
        importedContact("Emy", "Responsable de salle", "0690707862")
      ]
    },
    { name: "EDEIS", clientType: "A\xE9roport", city: "GRAND CASE", contacts: [importedContact("Virginie", "Charg\xE9e de boutique", "0690221235")] },
    { name: "GO & SEA", clientType: "Bateau", city: "ANSE MARCEL", contacts: [importedContact("Franck", "G\xE9rant", "0690665869")] },
    { name: "KALATUA WATERSPORTS", clientType: "Watersports", city: "MULLET BAY", contacts: [importedContact("Cyril", "G\xE9rant", "0690554266")] },
    { name: "LES PETITES AIGUILLES", clientType: "Couturi\xE8re", city: "MARIGOT", contacts: [importedContact("Mathilde", "G\xE9rant", "0683922788")] },
    { name: "SUN LOCATION", clientType: "Watersports", city: "MARIGOT", contacts: [importedContact("?", "G\xE9rant", "0690231511")] },
    { name: "A DOM CARAIBES", clientType: "Entretien", city: "HOPE ESTATE", contacts: [importedContact("Oph\xE9lie", "G\xE9rante", "0690221221", "ophelie.e@adom-caraibes.fr")] },
    { name: "LA TERRASSE", clientType: "Restaurant", city: "MARIGOT", contacts: [importedContact("Dylan", "G\xE9rante", "0690669999")] },
    {
      name: "CARIBBEAN LUXURY VACATION",
      clientType: "Agence Voyage",
      city: "MARIGOT",
      contacts: [
        importedContact("Muta", "femme g\xE9rant", "0786053934"),
        importedContact("Thomas", "G\xE9rant", "0687682648")
      ]
    },
    { name: "YKB BRUNO", clientType: "Cr\xE9atrice", city: "SAINT-BARTHELEMY", contacts: [importedContact("Bruno", "G\xE9rant", "0690533358")] },
    { name: "PATES ATRA", clientType: "Restaurant", city: "HOPE ESTATE", contacts: [importedContact("Mathilde", "G\xE9rant", "0690705106")] },
    { name: "POLO LE BOUCHER", clientType: "Restaurant", city: "HOPE ESTATE", contacts: [importedContact("Jessica", "G\xE9rante", "0690222046")] },
    { name: "DREAM OF TRAIL", clientType: "Association", city: "-", contacts: [importedContact("Quentin", "charg\xE9 de goodies", "0690751104")] },
    { name: "KALATUA RESTAURANT", clientType: "Restaurant", city: "MULLET BAY", contacts: [importedContact("Emmanuelle", "G\xE9rante", "0783652392")] },
    { name: "INNOVATION MEDICAL CARAIBES", clientType: "M\xE9dical", city: "-", contacts: [importedContact("?", "G\xE9rante", "0690485844")] },
    { name: "SOLEA STUDIO", clientType: "Pole Dance", city: "?", contacts: [importedContact("Ad\xE8le", "G\xE9rante", "0690437940")] },
    { name: "MOOD", clientType: "Restaurant", city: "HOPE ESTATE", contacts: [importedContact("Schmidt", "G\xE9rante", "0620102980")] },
    { name: "ANNE MODE CONCEPT (KALATUA)", clientType: "Boutique", city: "MULLET BAY", contacts: [importedContact("Anne", "G\xE9rante", "0690298858")] },
    { name: "OLDA STD", clientType: "", city: "", contacts: [] },
    { name: "DFR (BUZZ)", clientType: "Boutique", city: "HOPE ESTATE", contacts: [importedContact("Thomas", "Adjoint direction", "0690351641")] },
    { name: "OFFICE DU TOURISME", clientType: "Office du tourisme", city: "MARIGOT", contacts: [importedContact("Lou", "Responsable goodies", "0690420505")] },
    { name: "FARWOOD", clientType: "Charpentier", city: "LA SAVANE", contacts: [importedContact("Margo", "Femme du G\xE9rant", "0690096600")] },
    { name: "SOUALIGA HOMES", clientType: "Conciergerie", city: "GRAND CASE", contacts: [importedContact("Christine", "G\xE9rante", "0690889786")] },
    { name: "C CLIM", clientType: "Entretien", city: "-", contacts: [importedContact("Bertrand", "G\xE9rant", "0690555018")] },
    { name: "HAPPY SCHOOL", clientType: "Ecole", city: "GRAND CASE", contacts: [importedContact("H\xE9l\xE8ne", "Responsable", "0661506224")] },
    { name: "LE RADEAU BLEU", clientType: "Watersports", city: "ANSE MARCEL", contacts: [importedContact("?", "G\xE9rant", "0691282309")] },
    { name: "VILLA PRIVILEGE", clientType: "Conciergerie", city: "ANSE MARCEL", contacts: [importedContact("Alisson", "G\xE9rante", "0690348899")] },
    { name: "OUALICHI GOURMET", clientType: "Boutique", city: "CUL DE SAC", contacts: [importedContact("Alain", "G\xE9rant", "0690172732")] },
    { name: "WEST INDIES ISLANDER", clientType: "Boutique", city: "MARIGOT", contacts: [importedContact("Fred", "G\xE9rant", "0690445588")] },
    { name: "CLEAN FOSSES", clientType: "Entretien", city: "-", contacts: [importedContact("Eric", "G\xE9rant", "0690398812")] },
    { name: "HOTEL JM (KOHO)", clientType: "Hotel", city: "GRAND CASE", contacts: [importedContact("Mathis", "G\xE9rant", "0622361122")] },
    { name: "JC BAR COMPANY", clientType: "Restaurant", city: "CONCORDIA", contacts: [importedContact("Jordan", "G\xE9rant", "0690219000")] },
    { name: "LIGUE DE FOOTBALL SM", clientType: "Complexe Sportif", city: "MARIGOT", contacts: [importedContact("Ladislas", "Directeur", "0690374600")] },
    { name: "CAPTAIN JO", clientType: "Bateau", city: "ANSE MARCEL", contacts: [importedContact("Julie", "G\xE9rante", "0690379173")] },
    { name: "GRAND CASE BEACH CLUB", clientType: "Hotel", city: "GRAND CASE", contacts: [importedContact("Alexandra", "G\xE9rante", "0690610515")] },
    { name: "LE CARPACCIO", clientType: "Restaurant", city: "GRAND CASE", contacts: [importedContact("K\xE9vin", "G\xE9rant", "0690505441")] },
    { name: "100% VILLAS", clientType: "Conciergerie", city: "BAIE NETTLE", contacts: [importedContact("Vinciane", "Resp. Marketing", "0642266949")] },
    { name: "LA SAMANNA", clientType: "Hotel", city: "BAIE LONGUE", contacts: [importedContact("Eleonore", "Directrice", "12645846212")] },
    { name: "SOLUTION RESINE", clientType: "Artisan", city: "-", contacts: [importedContact("Guillaume", "G\xE9rant", "0690297282")] },
    {
      name: "BOIS ATTITUDE",
      clientType: "Agenceur",
      city: "MONT VERNON 1",
      contacts: [
        importedContact("Basile", "Fils G\xE9rant", "0690669424"),
        importedContact("David", "G\xE9rant", "0690246474")
      ]
    },
    { name: "COOL SXM", clientType: "Location", city: "BAIE ORIENTALE", contacts: [importedContact("Patrick", "G\xE9rant", "0699291969")] },
    { name: "LOVE BOAT", clientType: "Bateau", city: "ANSE MARCEL", contacts: [importedContact("Chris", "Capitaine bateau", "0690183337")] },
    { name: "TROPICAL RIDE", clientType: "Watersports", city: "BAIE ORIENTALE", contacts: [importedContact("L\xE9a", "G\xE9rante", "0690371349")] },
    { name: "KEN BROKER", clientType: "Agence immobili\xE8re", city: "GRAND CASE", contacts: [importedContact("Ken", "G\xE9rant", "0690888333")] },
    { name: "CSTL", clientType: "Plombier", city: "-", contacts: [importedContact("Max", "G\xE9rant", "0690522588")] },
    {
      name: "LE MARTIN",
      clientType: "Hotel",
      city: "CUL DE SAC",
      contacts: [
        importedContact("Marion", "G\xE9rante", "0690565376", "info@lemartinhotel.com"),
        importedContact("Emmanuel", "G\xE9rant", "0690358528", "info@lemartinhotel.com")
      ]
    },
    { name: "LLPM", clientType: "Conciergerie", city: "?", contacts: [importedContact("Chelsea", "Assistante Direction", "0690633449")] },
    { name: "CREOL ROCK WATERSPORTS", clientType: "Boutique", city: "GRAND CASE", contacts: [importedContact("J\xE9r\xF4me", "G\xE9rant", "0690565056")] },
    { name: "CANONICA", clientType: "Boutique", city: "A\xE9roport Princesse Juliana", contacts: [importedContact("", "Responsable")] },
    {
      name: "BLUE MARTINI",
      clientType: "Restaurant",
      city: "GRAND CASE",
      contacts: [
        importedContact("Victor", "G\xE9rant"),
        importedContact("Martin", "G\xE9rant")
      ]
    },
    { name: "SOUALIGA ELEVATOR", clientType: "Artisan", city: "-", contacts: [importedContact("Beno\xEEt", "G\xE9rant")] },
    { name: "TWENTY TWO", clientType: "Boutique", city: "-", contacts: [importedContact("H\xE9lia", "G\xE9rante")] },
    {
      name: "Atelier Agencement",
      clientType: "Agenceur",
      city: "HOPE ESTATE",
      contacts: [
        importedContact("Ga\xEBtan", "Resp. Site"),
        importedContact("Gaylord", "G\xE9rant")
      ]
    },
    { name: "LA CIGALE", clientType: "Restaurant", city: "BAIE NETTLE", contacts: [importedContact("", "", "", "restaurantlacigale@gmail.com")] },
    { name: "ARAWAK CHARTER BOAT", clientType: "Bateau", city: "ANSE MARCEL", contacts: [importedContact("", "", "0690502521", "contact@arawakcharters.com")] }
  ].map((client) => ({
    postalCode: "",
    createdAt: IMPORTED_CLIENT_DATE,
    ...client
  }));
  var TEAM_NOTE_DEFAULT_ITEMS = {
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
  var seed = {
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
      }
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
  var state = {
    view: "testPlanning",
    search: "",
    expandedClients: /* @__PURE__ */ new Set(),
    selectedDtfIds: /* @__PURE__ */ new Set(),
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
  var renderQueued = false;
  var pendingRender = {
    header: true,
    status: true,
    view: true,
    transition: false
  };
  var remoteRevision = 0;
  var remoteSyncReady = false;
  var remotePollingTimer = null;
  var remoteSaveTimer = null;
  var remoteSaveInFlight = false;
  var remotePollInFlight = false;
  var pendingRemoteSnapshot = null;
  var lastRemoteErrorAt = 0;
  var remoteSyncErrorShown = false;
  var remoteBootstrapComplete = false;
  var loadResult = loadDb();
  var db = loadResult.data;
  db.teamNotes = normalizeTeamNotes(db.teamNotes);
  state.storageRecoveryMessage = loadResult.recoveryMessage;
  var refs = {
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
  var SPELLCHECK_SENTENCE_FIELDS = /* @__PURE__ */ new Set([
    "label",
    "note",
    "technicalNote",
    "team-note-summary",
    "team-note-edit-label",
    "search"
  ]);
  var SPELLCHECK_WORD_FIELDS = /* @__PURE__ */ new Set([
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
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (response.status === 404) {
        remoteSyncReady = true;
        startRemotePolling();
        remoteBootstrapComplete = true;
        scheduleRemoteSave({ immediate: true });
        return;
      }
      if (!response.ok) {
        throw new Error("Remote sync failed with status ".concat(response.status));
      }
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        window.location.href = "/login";
        return;
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
      if (error instanceof TypeError || error instanceof SyntaxError) {
        window.setTimeout(() => {
          void startRemoteSync();
        }, REMOTE_SYNC_INTERVAL_MS);
        return;
      }
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
    if (Number(record == null ? void 0 : record.revision) > 1) {
      return false;
    }
    const remoteData = record == null ? void 0 : record.data;
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
    score += Array.isArray(sourceDb.teamNotes) ? sourceDb.teamNotes.reduce((total, note) => total + (Array.isArray(note == null ? void 0 : note.items) ? note.items.length : 0), 0) : 0;
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
        throw new Error("Remote poll failed with status ".concat(response.status));
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
    if (remoteSyncErrorShown) {
      return;
    }
    remoteSyncErrorShown = true;
    lastRemoteErrorAt = Date.now();
    showToast("Synchronisation serveur indisponible. Verifie la connexion.");
  }
  function fetchRemoteDb(revision = null) {
    const url = revision ? "".concat(SERVER_DB_ENDPOINT, "?revision=").concat(encodeURIComponent(revision)) : SERVER_DB_ENDPOINT;
    return fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });
  }
  function applyRemoteDbRecord(record, options = {}) {
    if (!(record == null ? void 0 : record.data) || typeof record.data !== "object") {
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
    refs.viewRoot.innerHTML = '\n    <section class="module-layout">\n      <article class="placeholder-card">\n        <p class="module-kicker">Erreur</p>\n        <strong>Le module a rencontre un probleme.</strong>\n        <p>'.concat(escapeHtml(message), "</p>\n      </article>\n    </section>\n  ");
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
    var _a;
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
        const entry = note == null ? void 0 : note.items.find((item) => item.id === itemId);
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
        showToast("Maquette termin\xE9e.");
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
        const item = db.purchaseItems.find((item2) => item2.id === id);
        if (item) {
          item.deletedAt = (/* @__PURE__ */ new Date()).toISOString();
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
        showToast("Ligne test planning supprim\xE9e.");
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
        const removable = (_a = [...item.prints].reverse().find((print) => !print.checked)) != null ? _a : item.prints[item.prints.length - 1];
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
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
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
      const row2 = target.closest("[data-client-id]");
      if (!row2) {
        return;
      }
      openSheet("editClient", { id: Number(row2.dataset.clientId) });
      return;
    }
    if (state.view === "testPlanning") {
      if (target.closest("[data-inline-status]")) return;
      const row2 = target.closest("[data-test-planning-id]");
      if (!row2) {
        return;
      }
      openSheet("editTestPlanningOrder", { id: Number(row2.dataset.testPlanningId) });
      return;
    }
    if (state.view === "textile") {
      const row2 = target.closest("[data-textile-id]");
      if (!row2) {
        return;
      }
      openSheet("editTextileOrder", { id: Number(row2.dataset.textileId) });
      return;
    }
    if (state.view === "purchase") {
      const row2 = target.closest("[data-purchase-id]");
      if (!row2) {
        return;
      }
      openSheet("editPurchaseItem", { id: Number(row2.dataset.purchaseId) });
      return;
    }
    if (state.view === "workshop") {
      const row2 = target.closest("[data-workshop-task-id]");
      if (!row2) {
        return;
      }
      openSheet("editWorkshopTask", { id: Number(row2.dataset.workshopTaskId) });
      return;
    }
    if (state.view === "improvements") {
      const row2 = target.closest("[data-improvement-id]");
      if (!row2) {
        return;
      }
      openSheet("editImprovementItem", { id: Number(row2.dataset.improvementId) });
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
      const row2 = event.target.closest("[data-client-id]");
      if (!row2) {
        return;
      }
      openSheet("editClient", { id: Number(row2.dataset.clientId) });
      return;
    }
    if (state.view === "testPlanning") {
      const row2 = event.target.closest("[data-test-planning-id]");
      if (!row2) {
        return;
      }
      openSheet("editTestPlanningOrder", { id: Number(row2.dataset.testPlanningId) });
      return;
    }
    if (state.view === "textile") {
      const row2 = event.target.closest("[data-textile-id]");
      if (!row2) {
        return;
      }
      openSheet("editTextileOrder", { id: Number(row2.dataset.textileId) });
      return;
    }
    if (state.view === "purchase") {
      const row2 = event.target.closest("[data-purchase-id]");
      if (!row2) {
        return;
      }
      openSheet("editPurchaseItem", { id: Number(row2.dataset.purchaseId) });
      return;
    }
    if (state.view === "workshop") {
      const row2 = event.target.closest("[data-workshop-task-id]");
      if (!row2) {
        return;
      }
      openSheet("editWorkshopTask", { id: Number(row2.dataset.workshopTaskId) });
      return;
    }
    if (state.view === "improvements") {
      const row2 = event.target.closest("[data-improvement-id]");
      if (!row2) {
        return;
      }
      openSheet("editImprovementItem", { id: Number(row2.dataset.improvementId) });
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
      const row2 = event.target.closest("[data-client-id]");
      if (!row2) {
        return;
      }
      openSheet("editClient", { id: Number(row2.dataset.clientId) });
      return;
    }
    if (state.view === "testPlanning") {
      const row2 = event.target.closest("[data-test-planning-id]");
      if (!row2) {
        return;
      }
      openSheet("editTestPlanningOrder", { id: Number(row2.dataset.testPlanningId) });
      return;
    }
    if (state.view === "textile") {
      const row2 = event.target.closest("[data-textile-id]");
      if (!row2) {
        return;
      }
      openSheet("editTextileOrder", { id: Number(row2.dataset.textileId) });
      return;
    }
    if (state.view === "purchase") {
      const row2 = event.target.closest("[data-purchase-id]");
      if (!row2) {
        return;
      }
      openSheet("editPurchaseItem", { id: Number(row2.dataset.purchaseId) });
      return;
    }
    if (state.view === "workshop") {
      const row2 = event.target.closest("[data-workshop-task-id]");
      if (!row2) {
        return;
      }
      openSheet("editWorkshopTask", { id: Number(row2.dataset.workshopTaskId) });
      return;
    }
    const row = event.target.closest("[data-improvement-id]");
    if (!row) {
      return;
    }
    openSheet("editImprovementItem", { id: Number(row.dataset.improvementId) });
  }
  function handleRootInput(event) {
    var _a, _b;
    const target = event.target;
    if (target.name === "team-note-edit-label") {
      autosizeTextarea(target);
      syncTeamNoteItemInput(
        Number(target.dataset.noteId),
        Number(target.dataset.itemId),
        String((_a = target.value) != null ? _a : "")
      );
    }
    if (target.name === "team-note-summary") {
      autosizeTextarea(target);
      syncTeamNoteSummary(
        Number(target.dataset.noteId),
        String((_b = target.value) != null ? _b : "")
      );
    }
  }
  function handleSheetDraftInput(event) {
    var _a, _b, _c;
    const target = event == null ? void 0 : event.target;
    if ((target == null ? void 0 : target.name) === "designPreset") {
      const presetValue = String((_a = target.value) != null ? _a : "").trim();
      const designInput = refs.sheetForm.elements.namedItem("designName");
      if (designInput instanceof HTMLInputElement) {
        designInput.value = presetValue;
      }
    }
    if ((target == null ? void 0 : target.name) === "stage" && target instanceof HTMLSelectElement && (state.activeSheetAction === "addTestPlanningOrder" || state.activeSheetAction === "editTestPlanningOrder")) {
      var statusField = (_b = refs.sheetForm) == null ? void 0 : _b.elements.namedItem("status");
      if (statusField instanceof HTMLSelectElement) {
        statusField.value = testPlanningDefaultStatus(target.value);
      }
      syncTestPlanningStageField();
    }
    if ((target == null ? void 0 : target.name) === "status" && target instanceof HTMLSelectElement && (state.activeSheetAction === "editTestPlanningOrder" || state.activeSheetAction === "addTestPlanningOrder")) {
      var newStatus = target.value;
      var targetStage = testPlanningStageForStatus(newStatus);
      if (targetStage) {
        var stageField = (_c = refs.sheetForm) == null ? void 0 : _c.elements.namedItem("stage");
        if (stageField instanceof HTMLSelectElement && stageField.value !== targetStage) {
          stageField.value = targetStage;
          syncTestPlanningStageField();
        }
      }
    }
    if ((target == null ? void 0 : target.name) === "needsMockup") {
      syncTestPlanningMockupField();
    }
    persistSheetDraft();
  }
  function handleRootChange(event) {
    var _a, _b;
    const target = event.target;
    if (target.dataset && target.dataset.inlineStatusSel) {
      handleInlineStatusEvent(target);
      return;
    }
    if (target.name === "team-note-edit-label") {
      saveTeamNoteItem(
        Number(target.dataset.noteId),
        Number(target.dataset.itemId),
        String((_a = target.value) != null ? _a : "")
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
        item.errorNote = String((_b = target.value) != null ? _b : "").trim();
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
      const print = item == null ? void 0 : item.prints.find((entry) => entry.id === printId);
      if (print) {
        print.checked = target.checked;
        item.updatedAt = isoNow();
        persistDb();
        requestRender({ header: false, status: true, view: false });
      }
    }
  }
  function handleRootSubmit(event) {
    var _a, _b, _c, _d, _e, _f;
    const form = event.target;
    if (form.dataset.form === "team-note-add") {
      event.preventDefault();
      const formData = new FormData(form);
      const noteId = Number(formData.get("noteId"));
      const label = String((_a = formData.get("label")) != null ? _a : "").trim();
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
        String((_b = formData.get("team-note-edit-label")) != null ? _b : "")
      );
      return;
    }
    if (form.dataset.form === "purchase-quick-add") {
      event.preventDefault();
      const formData = new FormData(form);
      const zone = String(formData.get("zone"));
      const label = String((_c = formData.get("label")) != null ? _c : "").trim();
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
      const label = String((_d = formData.get("label")) != null ? _d : "").trim();
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
      const type = String((_e = formData.get("type")) != null ? _e : "bug");
      const label = String((_f = formData.get("label")) != null ? _f : "").trim();
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S, _T, _U, _V, _W, _X, _Y, _Z, __, _$, _aa, _ba, _ca, _da, _ea, _fa, _ga, _ha, _ia, _ja, _ka, _la, _ma, _na, _oa, _pa, _qa, _ra, _sa, _ta, _ua, _va, _wa, _xa, _ya, _za, _Aa, _Ba, _Ca, _Da;
    event.preventDefault();
    const formData = new FormData(refs.sheetForm);
    if (state.activeSheetAction === "addClient") {
      const client = {
        id: nextId(db.clients),
        name: String((_a = formData.get("name")) != null ? _a : "").trim(),
        postalCode: String((_b = formData.get("postalCode")) != null ? _b : "").trim(),
        city: String((_c = formData.get("city")) != null ? _c : "").trim(),
        createdAt: isoToday(),
        contacts: [
          {
            id: 1,
            name: String((_d = formData.get("contactName")) != null ? _d : "").trim(),
            role: String((_e = formData.get("contactRole")) != null ? _e : "").trim(),
            phone: String((_f = formData.get("contactPhone")) != null ? _f : "").trim(),
            email: String((_g = formData.get("contactEmail")) != null ? _g : "").trim()
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
      client.name = String((_h = formData.get("name")) != null ? _h : "").trim();
      client.postalCode = String((_i = formData.get("postalCode")) != null ? _i : "").trim();
      client.city = String((_j = formData.get("city")) != null ? _j : "").trim();
      const contactName = String((_k = formData.get("contactName")) != null ? _k : "").trim();
      const contact = {
        id: primaryContact.id || 1,
        name: contactName,
        role: String((_l = formData.get("contactRole")) != null ? _l : "").trim(),
        phone: String((_m = formData.get("contactPhone")) != null ? _m : "").trim(),
        email: String((_n = formData.get("contactEmail")) != null ? _n : "").trim()
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
        dimensions: String((_o = formData.get("dimensions")) != null ? _o : "").trim(),
        logoPlacement: inferLogoPlacement(formData.get("designName")),
        designName: String((_p = formData.get("designName")) != null ? _p : "").trim(),
        size: String((_q = formData.get("size")) != null ? _q : "").trim(),
        color: String((_r = formData.get("color")) != null ? _r : "").trim(),
        technicalNote: String((_s = formData.get("technicalNote")) != null ? _s : "").trim(),
        quantity: Math.max(1, Number((_t = formData.get("quantity")) != null ? _t : 1) || 1),
        needsMockup: formData.get("needsMockup") === "on",
        clientType: String((_u = formData.get("clientType")) != null ? _u : "perso"),
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
      dtf.dimensions = String((_v = formData.get("dimensions")) != null ? _v : "").trim();
      dtf.logoPlacement = inferLogoPlacement(formData.get("designName"), dtf.logoPlacement);
      dtf.designName = String((_w = formData.get("designName")) != null ? _w : "").trim();
      dtf.size = String((_x = formData.get("size")) != null ? _x : "").trim();
      dtf.color = String((_y = formData.get("color")) != null ? _y : "").trim();
      dtf.technicalNote = String((_z = formData.get("technicalNote")) != null ? _z : "").trim();
      dtf.quantity = Math.max(1, Number((_A = formData.get("quantity")) != null ? _A : 1) || 1);
      dtf.needsMockup = formData.get("needsMockup") === "on";
      dtf.clientType = String((_B = formData.get("clientType")) != null ? _B : "perso");
      dtf.mockupCompletedAt = dtf.needsMockup ? "" : String((_C = dtf.mockupCompletedAt) != null ? _C : "");
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
        supplier: String((_D = formData.get("supplier")) != null ? _D : "").trim(),
        brand: String((_E = formData.get("brand")) != null ? _E : "").trim(),
        gender: String((_F = formData.get("gender")) != null ? _F : "").trim(),
        designation: String((_G = formData.get("designation")) != null ? _G : "").trim(),
        catalogReference: String((_H = formData.get("catalogReference")) != null ? _H : "").trim(),
        color: String((_I = formData.get("color")) != null ? _I : "").trim(),
        size: String((_J = formData.get("size")) != null ? _J : "").trim(),
        quantity: Math.max(1, Number((_K = formData.get("quantity")) != null ? _K : 1) || 1),
        deliveryStatus: String((_L = formData.get("deliveryStatus")) != null ? _L : "pending"),
        sessionLabel: String((_M = formData.get("sessionLabel")) != null ? _M : "").trim(),
        expectedDate: String((_N = formData.get("expectedDate")) != null ? _N : isoToday()),
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
      textileOrder.supplier = String((_O = formData.get("supplier")) != null ? _O : "").trim();
      textileOrder.brand = String((_P = formData.get("brand")) != null ? _P : "").trim();
      textileOrder.gender = String((_Q = formData.get("gender")) != null ? _Q : "").trim();
      textileOrder.designation = String((_R = formData.get("designation")) != null ? _R : "").trim();
      textileOrder.catalogReference = String((_S = formData.get("catalogReference")) != null ? _S : "").trim();
      textileOrder.color = String((_T = formData.get("color")) != null ? _T : "").trim();
      textileOrder.size = String((_U = formData.get("size")) != null ? _U : "").trim();
      textileOrder.quantity = Math.max(1, Number((_V = formData.get("quantity")) != null ? _V : 1) || 1);
      textileOrder.deliveryStatus = String((_W = formData.get("deliveryStatus")) != null ? _W : "pending");
      textileOrder.sessionLabel = String((_X = formData.get("sessionLabel")) != null ? _X : "").trim();
      textileOrder.expectedDate = String((_Y = formData.get("expectedDate")) != null ? _Y : isoToday());
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
      purchaseItem.zone = String((_Z = formData.get("zone")) != null ? _Z : "SXM");
      purchaseItem.label = String((__ = formData.get("label")) != null ? __ : "").trim();
      purchaseItem.quantity = Math.max(1, Number((_$ = formData.get("quantity")) != null ? _$ : 1) || 1);
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
      workshopTask.group = String((_aa = formData.get("group")) != null ? _aa : "standard");
      workshopTask.label = String((_ba = formData.get("label")) != null ? _ba : "").trim();
      workshopTask.recurring = formData.get("recurring") === "on";
      persistDb();
      clearSheetDraftByAction("editWorkshopTask", workshopTask.id);
      closeSheet();
      requestRender({ transition: true });
      showToast("Tache mise a jour.");
      return;
    }
    if (state.activeSheetAction === "addProductionItem") {
      const quantity = Math.max(1, Number((_ca = formData.get("quantity")) != null ? _ca : 1) || 1);
      db.productionItems.unshift({
        id: nextId(db.productionItems),
        clientType: String((_da = formData.get("clientType")) != null ? _da : "perso"),
        label: String((_ea = formData.get("label")) != null ? _ea : "").trim(),
        reference: String((_fa = formData.get("reference")) != null ? _fa : "").trim(),
        size: String((_ga = formData.get("size")) != null ? _ga : "").trim(),
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
        zone: String((_ha = formData.get("zone")) != null ? _ha : "SXM"),
        label: String((_ia = formData.get("label")) != null ? _ia : "").trim(),
        quantity: Math.max(1, Number((_ja = formData.get("quantity")) != null ? _ja : 1) || 1),
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
        group: String((_ka = formData.get("group")) != null ? _ka : "standard"),
        label: String((_la = formData.get("label")) != null ? _la : "").trim(),
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
      improvementItem.type = String((_ma = formData.get("type")) != null ? _ma : "bug");
      improvementItem.label = String((_na = formData.get("label")) != null ? _na : "").trim();
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
        clientType: String((_oa = formData.get("clientType")) != null ? _oa : "").trim().toUpperCase(),
        clientId: client.clientId,
        clientName: client.clientName,
        family: String((_pa = formData.get("family")) != null ? _pa : "").trim().toUpperCase(),
        product: String((_qa = formData.get("product")) != null ? _qa : "").trim().toUpperCase(),
        quantity: String((_ra = formData.get("quantity")) != null ? _ra : "").trim(),
        note: String((_sa = formData.get("note")) != null ? _sa : "").trim(),
        deliveryDate: String((_ta = formData.get("deliveryDate")) != null ? _ta : "").trim(),
        needsMockup: formData.get("needsMockup") === "on",
        mockupStatus: String((_ua = formData.get("mockupStatus")) != null ? _ua : "").trim(),
        mockupCompletedAt: "",
        status: String((_va = formData.get("status")) != null ? _va : "").trim(),
        stage: normalizeTestPlanningStage(formData.get("stage")),
        assignedTo: normalizeImportedAssignee(formData.get("assignedTo")),
        createdAt: isoNow()
      });
      persistDb();
      clearSheetDraftByAction("addTestPlanningOrder");
      state.activeTestStage = null;
      closeSheet();
      requestRender({ transition: true });
      showToast("Ligne test planning ajout\xE9e.");
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
      item.clientType = String((_wa = formData.get("clientType")) != null ? _wa : "").trim().toUpperCase();
      item.clientId = client.clientId;
      item.clientName = client.clientName;
      item.family = String((_xa = formData.get("family")) != null ? _xa : "").trim().toUpperCase();
      item.product = String((_ya = formData.get("product")) != null ? _ya : "").trim().toUpperCase();
      item.quantity = String((_za = formData.get("quantity")) != null ? _za : "").trim();
      item.note = String((_Aa = formData.get("note")) != null ? _Aa : "").trim();
      item.deliveryDate = String((_Ba = formData.get("deliveryDate")) != null ? _Ba : "").trim();
      item.needsMockup = formData.get("needsMockup") === "on";
      item.mockupStatus = String((_Ca = formData.get("mockupStatus")) != null ? _Ca : "").trim();
      if (item.needsMockup && item.mockupCompletedAt) {
      } else if (!item.needsMockup) {
        item.mockupCompletedAt = "";
      }
      item.status = String((_Da = formData.get("status")) != null ? _Da : "").trim();
      item.stage = normalizeTestPlanningStage(formData.get("stage"));
      item.assignedTo = normalizeImportedAssignee(formData.get("assignedTo"));
      persistDb();
      clearSheetDraftByAction("editTestPlanningOrder", item.id);
      closeSheet();
      requestRender({ transition: true });
      showToast("Ligne test planning mise \xE0 jour.");
    }
  }
  function requestRender(options = {}) {
    var _a, _b, _c;
    const next = {
      header: (_a = options.header) != null ? _a : true,
      status: (_b = options.status) != null ? _b : true,
      view: (_c = options.view) != null ? _c : true,
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
    return '\n    <section class="module-layout">\n      <article class="placeholder-card">\n        <p class="module-kicker">'.concat(escapeHtml(views[state.view].label), "</p>\n        <strong>Module en attente de construction</strong>\n      </article>\n    </section>\n  ");
  }
  function isUrgentTestPlanningItem(item) {
    if (!item.deliveryDate) return false;
    if (item.stage === "facture" || item.stage === "paye" || item.stage === "archived") return false;
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const delivery = /* @__PURE__ */ new Date(item.deliveryDate + "T00:00:00");
    if (Number.isNaN(delivery.getTime())) return false;
    const diffDays = Math.floor((delivery - today) / (1e3 * 60 * 60 * 24));
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
      return [item.clientName, item.family, item.product, item.quantity, item.note, item.status, item.mockupStatus || ""].join(" ").toLowerCase().includes(state.search);
    }).slice().sort((a, b) => (b.id || 0) - (a.id || 0));
    const activeStage = state.activeTestStage;
    let bodyHtml;
    if (activeStage === "__urgent__") {
      bodyHtml = urgentItems.length ? '<section class="test-planning-board">'.concat(urgentItems.map(renderTestPlanningCard).join(""), "</section>") : '<div class="empty-state">Aucune commande urgente.</div>';
    } else if (activeStage) {
      const filteredItems = db.testPlanningItems.filter((item) => {
        if (item.stage !== activeStage) return false;
        if (state.activeTestAssignee && item.assignedTo !== state.activeTestAssignee) return false;
        if (!state.search) return true;
        return [item.clientName, item.family, item.product, item.quantity, item.note, item.status, item.mockupStatus || ""].join(" ").toLowerCase().includes(state.search);
      }).slice().sort((a, b) => (b.id || 0) - (a.id || 0));
      bodyHtml = filteredItems.length ? '<section class="test-planning-board">'.concat(filteredItems.map(renderTestPlanningCard).join(""), "</section>") : '<div class="empty-state">Aucune commande pour cette s\xE9lection.</div>';
    } else {
      const allItems = db.testPlanningItems.filter((item) => {
        if (item.stage === "archived") return false;
        if (state.activeTestAssignee && item.assignedTo !== state.activeTestAssignee) return false;
        if (!state.search) return true;
        return [item.clientName, item.family, item.product, item.quantity, item.note, item.status, item.mockupStatus || ""].join(" ").toLowerCase().includes(state.search);
      }).slice().sort((a, b) => (b.id || 0) - (a.id || 0));
      bodyHtml = allItems.length ? '<section class="test-planning-board">'.concat(allItems.map(renderTestPlanningCard).join(""), "</section>") : '<div class="empty-state">Aucune commande.</div>';
    }
    const activeAssignee = state.activeTestAssignee;
    const assigneeChips = ORDER_ASSIGNEES.map((a) => {
      const isActive = activeAssignee === a;
      return '<button class="test-assignee-chip '.concat(isActive ? "is-active" : "", '" type="button" data-test-assignee-filter="').concat(escapeHtml(a), '">').concat(escapeHtml(a), "</button>");
    }).join("");
    return '\n    <section class="module-layout">\n      <section class="test-planning-steps">\n        <button class="test-step-chip '.concat(!activeStage ? "is-active" : "", '" type="button" data-test-stage-jump="__recent__" data-accent="blue">\n          <span>Toutes</span>\n          <strong>').concat(sections.filter((s) => s.key !== "archived").reduce((sum, s) => sum + s.rows.length, 0), '</strong>\n        </button>\n        <button class="test-step-chip ').concat(activeStage === "__urgent__" ? "is-active" : "", '" type="button" data-test-stage-jump="__urgent__" data-accent="red">\n          <span>Urgence</span>\n          <strong>').concat(urgentItems.length, "</strong>\n        </button>\n        ").concat(sections.map(renderTestPlanningStepSummary).join(""), '\n      </section>\n      <section class="test-planning-assignee-filters">\n        ').concat(assigneeChips, "\n      </section>\n      ").concat(bodyHtml, "\n    </section>\n  ");
  }
  function renderTestPlanningStepSummary(stage) {
    const isActive = state.activeTestStage === stage.key;
    return '\n    <button class="test-step-chip '.concat(isActive ? "is-active" : "", '" type="button" data-test-stage-jump="').concat(escapeHtml(stage.key), '" data-accent="').concat(escapeHtml(stage.accent), '">\n      <span>').concat(escapeHtml(stage.shortLabel), "</span>\n      <strong>").concat(stage.rows.length, "</strong>\n    </button>\n  ");
  }
  function renderTestPlanningCard(item) {
    var _a, _b, _c, _d;
    const stageIndex = TEST_PLANNING_STAGE_KEYS.indexOf(item.stage);
    const canGoPrev = stageIndex > 0;
    const canGoNext = stageIndex < TEST_PLANNING_STAGE_KEYS.length - 1;
    const stageLabel = (_b = (_a = TEST_PLANNING_STAGES[stageIndex]) == null ? void 0 : _a.label) != null ? _b : "";
    const stageAccent = (_d = (_c = TEST_PLANNING_STAGES[stageIndex]) == null ? void 0 : _c.accent) != null ? _d : "blue";
    var createdLabel = "";
    if (item.createdAt) {
      var d = new Date(item.createdAt);
      if (!isNaN(d.getTime())) {
        createdLabel = String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
      }
    }
    const mockupTag = item.needsMockup && !item.mockupCompletedAt ? '<span class="tp-mockup-corner">\u{1F3A8}</span>' : item.needsMockup && item.mockupCompletedAt ? '<span class="tp-mockup-corner is-done">\u2713</span>' : "";
    return '\n    <article class="tp-line" data-test-planning-id="'.concat(item.id, '" data-accent="').concat(escapeHtml(stageAccent), '" tabindex="0">\n      ').concat(mockupTag, '\n      <span class="tp-accent" data-accent="').concat(escapeHtml(stageAccent), '"></span>\n      <div class="tp-grid">\n        <span class="tp-badge" data-accent="').concat(escapeHtml(stageAccent), '">').concat(escapeHtml(stageLabel), '</span>\n        <span class="tp-type">').concat(escapeHtml(item.clientType || "\u2014"), '</span>\n        <strong class="tp-client">').concat(escapeHtml(item.clientName || "Client"), '</strong>\n        <span class="tp-family">').concat(escapeHtml(item.family || "\u2014"), '</span>\n        <span class="tp-product">').concat(escapeHtml(item.product || "\u2014"), '</span>\n        <span class="tp-qty">').concat(escapeHtml(item.quantity ? "\xD7" + item.quantity : "\u2014"), '</span>\n        <span class="tp-date">').concat(escapeHtml(item.deliveryDate ? formatDate(item.deliveryDate) : "\u2014"), '</span>\n        <span class="tp-status" data-inline-status="').concat(item.id, '" title="Cliquer pour changer">').concat(escapeHtml(item.status || stageLabel), '</span>\n        <select class="inline-status-select is-hidden" data-inline-status-sel="').concat(item.id, '"><option value="">\u2014 \xC9tat \u2014</option>').concat(renderTestPlanningStatusOptgroups(item.status), '</select>\n        <span class="tp-actions">\n          <button class="pill-button" type="button" data-action="test-planning-prev-stage" data-id="').concat(item.id, '" title="\xC9tape pr\xE9c\xE9dente" ').concat(canGoPrev ? "" : "disabled", '>\u2190</button>\n          <button class="pill-button" type="button" data-action="test-planning-next-stage" data-id="').concat(item.id, '" title="\xC9tape suivante" ').concat(canGoNext ? "" : "disabled", '>\u2192</button>\n          <button class="row-action row-action-subtle is-danger" type="button" data-action="delete-test-planning" data-id="').concat(item.id, '" aria-label="Supprimer">\xD7</button>\n        </span>\n      </div>\n      ').concat(item.note ? '<div class="tp-sub"><span class="tp-note">' + escapeHtml(item.note) + "</span></div>" : "", "\n      ").concat(createdLabel ? '<time class="tp-time">'.concat(createdLabel, "</time>") : "", "\n    </article>\n  ");
  }
  function renderTasksView() {
    const notes = getVisibleTeamNotes();
    return '\n    <section class="module-layout">\n      <section class="team-notes-grid">\n        '.concat(notes.map(renderTeamNoteCard).join(""), "\n      </section>\n    </section>\n  ");
  }
  function renderTeamNoteCard(note) {
    var _a;
    const visibleItems = getVisibleTeamNoteItems(note);
    return '\n    <article class="team-note-card" data-tone="'.concat(teamNoteTone(note.name), '">\n      <header class="team-note-head">\n        <div>\n          <h3>').concat(escapeHtml(note.name), '</h3>\n        </div>\n        <span class="chip">').concat(note.updatedAt ? escapeHtml(formatDate(note.updatedAt)) : "Vide", '</span>\n      </header>\n      <label class="team-note-summary">\n        <span class="team-note-summary-label">Informations importantes</span>\n        <textarea\n          class="team-note-summary-input"\n          name="team-note-summary"\n          rows="2"\n          data-note-id="').concat(note.id, '"\n          placeholder="Ajouter une information..."\n        >').concat(escapeHtml((_a = note.summary) != null ? _a : ""), '</textarea>\n      </label>\n      <form class="team-note-add" data-form="team-note-add">\n        <input type="hidden" name="noteId" value="').concat(note.id, '">\n        <div class="quick-add-row team-note-add-row">\n          <input name="label" type="text">\n          <button class="button" type="submit">Ajouter</button>\n        </div>\n      </form>\n      <div class="team-note-list" aria-label="Notes de ').concat(escapeHtml(note.name), '">\n        ').concat(visibleItems.length ? visibleItems.map((item) => renderTeamNoteItem(note.id, item)).join("") : '<div class="empty-state">Aucune ligne.</div>', "\n      </div>\n    </article>\n  ");
  }
  function renderTeamNoteItem(noteId, item) {
    return '\n    <article class="team-note-item" data-checked="'.concat(item.checked ? "true" : "false", '">\n      <button class="team-note-dot" type="button" data-action="toggle-team-note-item" data-note-id="').concat(noteId, '" data-item-id="').concat(item.id, '" aria-label="').concat(item.checked ? "Marquer comme non faite" : "Marquer comme faite", '"></button>\n      <form class="team-note-edit" data-form="team-note-edit">\n        <input type="hidden" name="noteId" value="').concat(noteId, '">\n        <input type="hidden" name="itemId" value="').concat(item.id, '">\n        <textarea\n          class="team-note-edit-input"\n          name="team-note-edit-label"\n          rows="1"\n          data-note-id="').concat(noteId, '"\n          data-item-id="').concat(item.id, '"\n          autocomplete="off"\n        >').concat(escapeHtml(item.label), '</textarea>\n      </form>\n      <button class="row-action row-action-subtle is-danger" type="button" data-action="delete-team-note-item" data-note-id="').concat(noteId, '" data-item-id="').concat(item.id, '" aria-label="Supprimer la ligne">\xD7</button>\n    </article>\n  ');
  }
  function renderClientsView() {
    const rows = getVisibleClientRows();
    return '\n    <section class="module-layout">\n      <article class="module-panel orders-toolbar">\n        <header class="module-head orders-toolbar-head">\n          <div>\n            <p class="module-kicker">Liste</p>\n            <h3>Clients Pro</h3>\n          </div>\n          <div class="module-actions">\n            <span class="chip">'.concat(rows.length, " ligne").concat(rows.length > 1 ? "s" : "", '</span>\n          </div>\n        </header>\n      </article>\n      <div class="table-shell">\n        <div class="dense-table-wrap">\n          <table class="data-table">\n            <thead>\n              <tr>\n                <th>Soci\xE9t\xE9</th>\n                <th>Ville</th>\n                <th>Contact</th>\n                <th>T\xE9l.</th>\n                <th>Email</th>\n              </tr>\n            </thead>\n            <tbody>\n              ').concat(rows.length ? rows.map(renderClientRow).join("") : '<tr><td colspan="5"><div class="empty-state">Aucun client ne correspond a la recherche.</div></td></tr>', "\n            </tbody>\n          </table>\n        </div>\n      </div>\n    </section>\n  ");
  }
  function renderClientRow(row) {
    const client = row.client;
    const contact = row.contact;
    return '\n    <tr data-client-id="'.concat(client.id, '" data-contact-id="').concat(contact.id, '" tabindex="0">\n      <td><strong>').concat(escapeHtml(client.name), "</strong></td>\n      <td>").concat(escapeHtml(client.city || "\u2014"), "</td>\n      <td>").concat(escapeHtml(contact.name || "\u2014"), "</td>\n      <td>").concat(escapeHtml(contact.phone || "\u2014"), "</td>\n      <td>").concat(escapeHtml(contact.email || "\u2014"), "</td>\n    </tr>\n  ");
  }
  function renderDtfView() {
    const rows = getVisibleDtfItems();
    const archiveCount = db.dtfRequests.filter((item) => item.archivedAt).length;
    const allSelected = rows.length > 0 && rows.every((row) => state.selectedDtfIds.has(row.id));
    const isMockupView = state.view === "dtfMockups";
    return '\n    <section class="module-layout">\n      <div class="archive-toggle">\n        <div>\n          <strong>'.concat(isMockupView ? "Archives maquettes" : "Archives DTF", '</strong>\n          <p class="archive-copy">').concat(archiveCount, '</p>\n        </div>\n        <div class="archive-actions">\n          <button class="pill-button ').concat(state.showDtfArchives ? "is-active" : "", '" type="button" data-action="toggle-dtf-archives">\n            ').concat(state.showDtfArchives ? "Voir les actives" : "Voir les archives", "\n          </button>\n      </div>\n      </div>\n      ").concat(state.selectedDtfIds.size ? renderDtfSelectionBar() : "", '\n      <div class="table-shell">\n        <div class="dense-table-wrap">\n          <table class="data-table">\n            <thead>\n              <tr>\n                <th class="checkbox-cell"><input type="checkbox" name="dtf-select-all" ').concat(allSelected ? "checked" : "", "></th>\n                <th>Date</th>\n                <th>Client</th>\n                <th>Design</th>\n                <th>Dimension</th>\n                <th>Logo</th>\n                <th>Taille</th>\n                <th>Couleur</th>\n                <th>Note</th>\n                <th>Qte</th>\n                <th>Type</th>\n                <th>Action</th>\n              </tr>\n            </thead>\n            <tbody>\n              ").concat(rows.length ? rows.map(renderDtfRow).join("") : '<tr><td colspan="12"><div class="empty-state">'.concat(isMockupView ? "Aucune maquette DTF a afficher." : "Aucune demande DTF a afficher.", "</div></td></tr>"), "\n            </tbody>\n          </table>\n        </div>\n      </div>\n    </section>\n  ");
  }
  function renderDtfSelectionBar() {
    return '\n    <section class="selection-bar">\n      <div>\n        <strong>'.concat(state.selectedDtfIds.size, " selection").concat(state.selectedDtfIds.size > 1 ? "s" : "", '</strong>\n      </div>\n      <div class="selection-actions">\n        <button class="pill-button" type="button" data-action="duplicate-dtf">Dupliquer</button>\n        <button class="pill-button" type="button" data-action="validate-dtf">Valider</button>\n        <button class="pill-button" type="button" data-action="archive-dtf">').concat(state.showDtfArchives ? "Restaurer" : "Archiver", '</button>\n        <button class="pill-button" type="button" data-action="delete-dtf">Supprimer</button>\n      </div>\n    </section>\n  ');
  }
  function renderDtfRow(row) {
    const checked = state.selectedDtfIds.has(row.id);
    const typeTone = row.mockupCompletedAt ? "ready" : row.needsMockup ? "urgent" : row.clientType === "pro" ? "pro" : "perso";
    const typeLabel = row.mockupCompletedAt ? "Maquette faite" : row.needsMockup ? "Maquette" : row.clientType === "pro" ? "PRO" : "Perso";
    return '\n    <tr data-dtf-id="'.concat(row.id, '">\n      <td class="checkbox-cell"><input type="checkbox" name="dtf-select" value="').concat(row.id, '" ').concat(checked ? "checked" : "", '></td>\n      <td><span class="order-date-chip">').concat(formatDate(row.createdAt), "</span></td>\n      <td>").concat(escapeHtml(dtfClientLabel(row)), "</td>\n      <td><strong>").concat(escapeHtml(row.designName), "</strong></td>\n      <td>").concat(escapeHtml(row.dimensions), '</td>\n      <td><span class="status-badge" data-tone="draft">').concat(escapeHtml(normalizeLogoPlacement(row.logoPlacement)), "</span></td>\n      <td>").concat(escapeHtml(row.size), "</td>\n      <td>").concat(escapeHtml(row.color), "</td>\n      <td>").concat(escapeHtml(row.technicalNote), "</td>\n      <td>").concat(row.quantity, '</td>\n      <td><span class="status-badge" data-tone="').concat(typeTone, '">').concat(typeLabel, '</span></td>\n      <td>\n        <div class="row-actions">\n          <button class="row-action" type="button" data-action="').concat(row.archivedAt ? "restore-single-dtf" : "archive-single-dtf", '" data-id="').concat(row.id, '">\n            ').concat(row.archivedAt ? "\u21BA" : "\u2934", '\n          </button>\n          <button class="row-action is-danger" type="button" data-action="delete-single-dtf" data-id="').concat(row.id, '">\xD7</button>\n        </div>\n      </td>\n    </tr>\n  ');
  }
  function renderMockupsView() {
    const rows = getVisibleMockupItems();
    const archiveCount = db.dtfRequests.filter((item) => item.archivedAt && item.needsMockup).length;
    return '\n    <section class="module-layout orders-layout">\n      <div class="archive-toggle">\n        <div>\n          <strong>Archives maquettes</strong>\n          <p class="archive-copy">'.concat(archiveCount, '</p>\n        </div>\n        <div class="archive-actions">\n          <button class="pill-button ').concat(state.showDtfArchives ? "is-active" : "", '" type="button" data-action="toggle-dtf-archives">\n            ').concat(state.showDtfArchives ? "Voir les actives" : "Voir les archives", '\n          </button>\n        </div>\n      </div>\n      <section class="orders-board">\n        <div class="orders-list">\n          ').concat(rows.length ? rows.map(renderMockupRow).join("") : '<div class="empty-state">Aucune maquette a faire.</div>', "\n        </div>\n      </section>\n    </section>\n  ");
  }
  function renderMockupRow(item) {
    const isTestPlanning = item.kind === "testPlanning";
    const sourceLabel = isTestPlanning ? "Planning" : "DTF";
    const zoneLabel = item.zone || (isTestPlanning ? "Commandes g\xE9n\xE9rales" : "DTF");
    const completeAction = isTestPlanning ? "complete-test-planning-mockup" : "complete-dtf-mockup";
    return '\n    <article class="order-card order-card-line" data-zone="'.concat(escapeHtml(zoneLabel), '">\n      <div class="order-line-primary">\n        <div class="order-line-summary order-line-primary-main">\n          <strong class="order-client-name">').concat(escapeHtml(item.client), '</strong>\n          <span class="order-zone-chip" data-zone="').concat(escapeHtml(zoneLabel), '">').concat(escapeHtml(zoneLabel), '</span>\n          <span class="order-type-badge" data-tone="pro">').concat(sourceLabel, "</span>\n          ").concat(item.quantity > 0 ? '<span class="order-qty-chip">'.concat(item.quantity, "</span>") : "", "\n          ").concat(item.meta ? '<span class="order-inline-copy">'.concat(escapeHtml(item.meta), "</span>") : "", '\n        </div>\n        <div class="order-line-primary-note">\n          <span class="order-inline-copy order-inline-note">').concat(escapeHtml(item.title), '</span>\n        </div>\n      </div>\n      <div class="order-line-meta">\n        <div class="order-deadline">\n          <strong>').concat(escapeHtml(item.date ? formatDate(item.date) : "\u2014"), '</strong>\n        </div>\n      </div>\n      <div class="order-card-controls order-card-controls-line">\n        <div class="order-controls-inline">\n          <button class="button button-primary" type="button" data-action="').concat(completeAction, '" data-id="').concat(item.id, '">\n            Maquette faite\n          </button>\n        </div>\n      </div>\n    </article>\n  ');
  }
  function renderProductionView() {
    const rows = getVisibleProductionItems();
    return '\n    <section class="module-layout">\n      <article class="module-panel orders-toolbar">\n        <header class="module-head orders-toolbar-head">\n          <div>\n            <p class="module-kicker">Suivi atelier</p>\n            <h3>Production</h3>\n          </div>\n          <div class="module-actions">\n            <span class="chip">'.concat(rows.length, " PRT").concat(rows.length > 1 ? "s" : "", '</span>\n          </div>\n        </header>\n      </article>\n      <section class="orders-board">\n        <div class="orders-list production-list">\n          ').concat(rows.length ? rows.map(renderProductionItem).join("") : '<div class="empty-state">Aucune ligne de production.</div>', "\n        </div>\n      </section>\n    </section>\n  ");
  }
  function renderProductionItem(item) {
    var _a;
    const showError = item.status === "Erreur";
    const totalPrints = getProductionQuantity(item);
    const completedPrints = getProductionCompletedCount(item);
    return '\n    <article class="order-card production-card" data-status="'.concat(escapeHtml(item.status), '">\n      <div class="production-card-main">\n        <div class="order-line-summary">\n          <strong class="order-client-name">').concat(escapeHtml(item.label), '</strong>\n          <span class="order-type-badge" data-tone="').concat(item.clientType === "pro" ? "pro" : "perso", '">').concat(item.clientType === "pro" ? "PRO" : "Perso", "</span>\n          ").concat(item.reference ? '<span class="order-inline-copy">'.concat(escapeHtml(item.reference), "</span>") : "", "\n          ").concat(item.size ? '<span class="order-qty-chip">'.concat(escapeHtml(item.size), "</span>") : "", '\n          <span class="status-badge" data-tone="').concat(productionTone(item.status), '">').concat(escapeHtml(item.status), '</span>\n          <span class="order-qty-chip">').concat(completedPrints, "/").concat(totalPrints, '</span>\n        </div>\n        <div class="production-checklist" aria-label="Points de production">\n          ').concat(item.prints.map((print) => '\n            <label class="production-checkpoint">\n              <input\n                type="checkbox"\n                name="production-print-checked"\n                data-id="'.concat(item.id, '"\n                value="').concat(print.id, '"\n                ').concat(print.checked ? "checked" : "", "\n              >\n              <span></span>\n            </label>\n          ")).join(""), "\n        </div>\n        ").concat(showError && item.errorNote ? '<p class="production-error-copy">'.concat(escapeHtml(item.errorNote), "</p>") : "", '\n      </div>\n      <div class="production-counter" aria-label="Compteur">\n        <button class="row-action" type="button" data-action="decrease-production-quantity" data-id="').concat(item.id, '" aria-label="Diminuer">\u2212</button>\n        <strong>').concat(totalPrints, '</strong>\n        <button class="row-action" type="button" data-action="increase-production-quantity" data-id="').concat(item.id, '" aria-label="Augmenter">+</button>\n      </div>\n      <div class="production-card-controls">\n        <select class="field-select table-status-select" name="production-status" data-id="').concat(item.id, '" aria-label="Statut production">\n          ').concat(renderProductionStatusOptions(item.status), '\n        </select>\n        <button class="row-action" type="button" data-action="duplicate-production-item" data-id="').concat(item.id, '" aria-label="Dupliquer">\u29C9</button>\n        <button class="row-action is-danger" type="button" data-action="delete-production-item" data-id="').concat(item.id, '" aria-label="Supprimer la ligne">\xD7</button>\n      </div>\n      ').concat(showError ? '\n        <label class="production-error-field">\n          <span class="field-label">Erreur</span>\n          <textarea class="field-textarea production-error-textarea" name="production-error" data-id="'.concat(item.id, '" placeholder="Ajouter l\'erreur...">').concat(escapeHtml((_a = item.errorNote) != null ? _a : ""), "</textarea>\n        </label>\n      ") : "", "\n    </article>\n  ");
  }
  function renderTextileView() {
    const rows = getVisibleTextileOrders();
    const archiveCount = db.textileOrders.filter((item) => item.archivedAt).length;
    return '\n    <section class="module-layout">\n      <div class="archive-toggle">\n        <div>\n          <strong>Commandes fournisseur</strong>\n          <p class="archive-copy">'.concat(archiveCount, '</p>\n        </div>\n        <div class="archive-actions">\n          <button class="pill-button ').concat(state.showTextileArchives ? "is-active" : "", '" type="button" data-action="toggle-textile-archives">\n            ').concat(state.showTextileArchives ? "Voir les actives" : "Voir les archives", '\n          </button>\n        </div>\n      </div>\n      <div class="table-shell">\n        <div class="dense-table-wrap">\n          <table class="data-table">\n            <thead>\n              <tr>\n                ').concat(TEXTILE_COLUMN_DEFINITIONS.map((column) => renderTextileHead(column.label, column.key)).join(""), "\n                <th>Action</th>\n              </tr>\n            </thead>\n            <tbody>\n              ").concat(rows.length ? rows.map(renderTextileRow).join("") : '<tr><td colspan="13"><div class="empty-state">Aucune commande textile a afficher.</div></td></tr>', "\n            </tbody>\n          </table>\n        </div>\n      </div>\n    </section>\n  ");
  }
  function renderTextileHead(label, key) {
    const direction = state.textileSort.key === key ? state.textileSort.direction : "";
    return '<th><button class="sort-button" type="button" data-action="sort-textile" data-key="'.concat(key, '" ').concat(direction ? 'data-direction="'.concat(direction, '"') : "", ">").concat(label, "</button></th>");
  }
  function renderTextileRow(row) {
    return '\n    <tr data-textile-id="'.concat(row.id, '" tabindex="0">\n      <td>').concat(escapeHtml(textileClientLabel(row)), "</td>\n      <td>").concat(escapeHtml(row.supplier), "</td>\n      <td>").concat(escapeHtml(row.brand), "</td>\n      <td>").concat(escapeHtml(row.gender), "</td>\n      <td>").concat(escapeHtml(row.designation), "</td>\n      <td>").concat(escapeHtml(row.catalogReference), "</td>\n      <td>").concat(escapeHtml(row.color), "</td>\n      <td>").concat(escapeHtml(row.size), "</td>\n      <td>").concat(row.quantity, '</td>\n      <td><span class="delivery-badge" data-tone="').concat(deliveryTone(row.deliveryStatus), '">').concat(escapeHtml(row.deliveryStatus), "</span></td>\n      <td>").concat(escapeHtml(row.sessionLabel), "</td>\n      <td>").concat(formatDate(row.expectedDate), '</td>\n      <td>\n        <div class="row-actions">\n          <button class="row-action" type="button" data-action="').concat(row.archivedAt ? "restore-textile" : "archive-textile", '" data-id="').concat(row.id, '">\n            ').concat(row.archivedAt ? "\u21BA" : "\u2934", '\n          </button>\n          <button class="row-action is-danger" type="button" data-action="delete-textile" data-id="').concat(row.id, '">\xD7</button>\n        </div>\n      </td>\n    </tr>\n  ');
  }
  function renderPurchaseView() {
    const zones = ["SXM", "Europe", "USA"];
    return '\n    <section class="module-layout">\n      <div class="zone-grid">\n        '.concat(zones.map(renderPurchaseZone).join(""), "\n      </div>\n    </section>\n  ");
  }
  function renderPurchaseZone(zone) {
    const items = getVisiblePurchaseItems(zone);
    return '\n    <article class="zone-column">\n      <header class="module-head">\n        <div>\n          <p class="module-kicker">'.concat(zone, "</p>\n          <h3>").concat(items.length, " article").concat(items.length > 1 ? "s" : "", '</h3>\n        </div>\n      </header>\n      <div class="module-body">\n        <form class="quick-add" data-form="purchase-quick-add">\n          <input type="hidden" name="zone" value="').concat(zone, '">\n          <div class="quick-add-row">\n            <input name="label" type="text" placeholder="Nouvel article">\n            <button class="button" type="submit">Ajouter</button>\n          </div>\n        </form>\n        <div class="list-grid">\n          ').concat(items.length ? items.map(renderPurchaseItem).join("") : '<div class="empty-state">Aucun article pour '.concat(zone, ".</div>"), "\n        </div>\n      </div>\n    </article>\n  ");
  }
  function renderPurchaseItem(item) {
    return '\n    <article class="item-row" data-purchase-id="'.concat(item.id, '" tabindex="0">\n      <label class="stack-meta">\n        <input type="checkbox" name="purchase-checked" value="').concat(item.id, '" ').concat(item.checked ? "checked" : "", ">\n        <strong>").concat(escapeHtml(item.label), "</strong>\n        <span>x").concat(item.quantity, '</span>\n      </label>\n      <button class="row-action is-danger" type="button" data-action="delete-purchase" data-id="').concat(item.id, '">\xD7</button>\n    </article>\n  ');
  }
  function renderWorkshopView() {
    const groups = [
      { key: "standard", label: "Standard" },
      { key: "atelier", label: "Atelier" },
      { key: "dtf", label: "DTF" }
    ];
    return '\n    <section class="module-layout">\n      <div class="task-grid">\n        '.concat(groups.map(renderWorkshopColumn).join(""), "\n      </div>\n    </section>\n  ");
  }
  function renderWorkshopColumn(group) {
    const tasks = getVisibleWorkshopTasks(group.key);
    return '\n    <article class="task-column">\n      <header class="module-head">\n        <div>\n          <p class="module-kicker">'.concat(group.label, "</p>\n          <h3>").concat(tasks.filter((item) => !item.checked).length, ' restantes</h3>\n        </div>\n      </header>\n      <div class="module-body">\n        <form class="quick-add" data-form="task-quick-add">\n          <input type="hidden" name="group" value="').concat(group.key, '">\n          <div class="quick-add-row">\n            <input name="label" type="text" placeholder="Nouvelle tache">\n            <button class="button" type="submit">Ajouter</button>\n            <span></span>\n          </div>\n        </form>\n        <div class="list-grid">\n          ').concat(tasks.length ? tasks.map(renderWorkshopTask).join("") : '<div class="empty-state">Aucune tache dans '.concat(group.label, ".</div>"), "\n        </div>\n      </div>\n    </article>\n  ");
  }
  function renderWorkshopTask(task) {
    return '\n    <article class="task-row" data-workshop-task-id="'.concat(task.id, '" tabindex="0">\n      <label class="stack-meta">\n        <input type="checkbox" name="task-checked" value="').concat(task.id, '" ').concat(task.checked ? "checked" : "", ">\n        <strong>").concat(escapeHtml(task.label), "</strong>\n        <span>").concat(task.recurring ? "Recurrente" : "Ponctuelle", '</span>\n      </label>\n      <button class="row-action is-danger" type="button" data-action="delete-task" data-id="').concat(task.id, '">\xD7</button>\n    </article>\n  ');
  }
  function renderImprovementsView() {
    return '\n    <section class="module-layout">\n      <div class="task-grid">\n        '.concat(IMPROVEMENT_TYPES.map(renderImprovementColumn).join(""), "\n      </div>\n    </section>\n  ");
  }
  function renderImprovementColumn(type) {
    const items = getVisibleImprovementItems(type.key);
    return '\n    <article class="task-column">\n      <header class="module-head">\n        <div>\n          <p class="module-kicker">'.concat(escapeHtml(type.label), "</p>\n          <h3>").concat(items.length, " ligne").concat(items.length > 1 ? "s" : "", '</h3>\n        </div>\n      </header>\n      <div class="module-body">\n        <form class="quick-add" data-form="improvement-quick-add">\n          <input type="hidden" name="type" value="').concat(type.key, '">\n          <div class="quick-add-row">\n            <input name="label" type="text" placeholder="Nouvelle remontee">\n            <button class="button" type="submit">Ajouter</button>\n            <span></span>\n          </div>\n        </form>\n        <div class="list-grid">\n          ').concat(items.length ? items.map(renderImprovementItem).join("") : '<div class="empty-state">Aucune remontee dans '.concat(escapeHtml(type.label), ".</div>"), "\n        </div>\n      </div>\n    </article>\n  ");
  }
  function renderImprovementItem(item) {
    return '\n    <article class="task-row" data-improvement-id="'.concat(item.id, '" tabindex="0">\n      <div class="stack-meta">\n        <strong>').concat(escapeHtml(item.label), "</strong>\n        <span>").concat(escapeHtml(improvementTypeLabel(item.type)), '</span>\n      </div>\n      <button class="row-action is-danger" type="button" data-action="delete-improvement" data-id="').concat(item.id, '">\xD7</button>\n    </article>\n  ');
  }
  function openSheet(action, options = {}) {
    var _a, _b, _c, _d, _e, _f, _g;
    state.activeSheetAction = action;
    state.activeDtfId = action === "editDtf" ? (_a = options.id) != null ? _a : null : null;
    state.activeTextileId = action === "editTextileOrder" ? (_b = options.id) != null ? _b : null : null;
    state.activePurchaseId = action === "editPurchaseItem" ? (_c = options.id) != null ? _c : null : null;
    state.activeWorkshopTaskId = action === "editWorkshopTask" ? (_d = options.id) != null ? _d : null : null;
    state.activeImprovementId = action === "editImprovementItem" ? (_e = options.id) != null ? _e : null : null;
    state.activeTestPlanningId = action === "editTestPlanningOrder" ? (_f = options.id) != null ? _f : null : null;
    state.activeClientId = action === "editClient" ? (_g = options.id) != null ? _g : null : null;
    pauseRemotePolling();
    refs.sheetDialog.dataset.layout = action === "addDtf" || action === "editDtf" ? "dtf-inline" : action === "addTextileOrder" || action === "editTextileOrder" ? "textile-inline" : action === "addClient" || action === "editClient" ? "client-inline" : action === "addTestPlanningOrder" || action === "editTestPlanningOrder" ? "test-planning-inline" : "";
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
      return '\n      <div class="field-grid production-form-grid">\n        <label>\n          <span class="field-label">Type</span>\n          <select class="field-select" name="clientType">\n            <option value="perso" selected>Perso</option>\n            <option value="pro">Pro</option>\n          </select>\n        </label>\n        <label class="field-span">\n          <span class="field-label">Nom du PRT</span>\n          <input class="field-input" name="label" type="text" placeholder="Ex: Logo dos noir">\n        </label>\n        <label>\n          <span class="field-label">R\xE9f\xE9rence</span>\n          <input class="field-input" name="reference" type="text" placeholder="Ex: H-001">\n        </label>\n        <label>\n          <span class="field-label">Taille</span>\n          <input class="field-input" name="size" type="text" placeholder="Ex: M, L, XL">\n        </label>\n        <label>\n          <span class="field-label">Combien de fois</span>\n          <input class="field-input" name="quantity" type="number" min="1" value="1">\n        </label>\n      </div>\n    ';
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
    var _a;
    return '\n    <div class="field-grid">\n      <label>\n        <span class="field-label">Zone</span>\n        <select class="field-select" name="zone">\n          <option value="SXM" '.concat((item == null ? void 0 : item.zone) === "SXM" ? "selected" : "", '>SXM</option>\n          <option value="Europe" ').concat((item == null ? void 0 : item.zone) === "Europe" ? "selected" : "", '>Europe</option>\n          <option value="USA" ').concat((item == null ? void 0 : item.zone) === "USA" ? "selected" : "", '>USA</option>\n        </select>\n      </label>\n      <label>\n        <span class="field-label">Quantite</span>\n        <input class="field-input" name="quantity" type="number" min="1" value="').concat(Math.max(1, Number(item == null ? void 0 : item.quantity) || 1), '">\n      </label>\n      <label class="field-span">\n        <span class="field-label">Article</span>\n        <input class="field-input" name="label" type="text" value="').concat(escapeHtml((_a = item == null ? void 0 : item.label) != null ? _a : ""), '">\n      </label>\n    </div>\n  ');
  }
  function renderWorkshopTaskForm(task = null) {
    var _a;
    return '\n    <div class="field-grid">\n      <label>\n        <span class="field-label">Categorie</span>\n        <select class="field-select" name="group">\n          <option value="standard" '.concat((task == null ? void 0 : task.group) === "standard" ? "selected" : "", '>Standard</option>\n          <option value="atelier" ').concat((task == null ? void 0 : task.group) === "atelier" ? "selected" : "", '>Atelier</option>\n          <option value="dtf" ').concat((task == null ? void 0 : task.group) === "dtf" ? "selected" : "", '>DTF</option>\n        </select>\n      </label>\n      <label class="field-span">\n        <span class="field-label">Tache</span>\n        <input class="field-input" name="label" type="text" value="').concat(escapeHtml((_a = task == null ? void 0 : task.label) != null ? _a : ""), '">\n      </label>\n      <label>\n        <span class="field-label">Recurrente</span>\n        <input name="recurring" type="checkbox" ').concat((task == null ? void 0 : task.recurring) ? "checked" : "", ">\n      </label>\n    </div>\n  ");
  }
  function renderImprovementForm(item = null) {
    var _a;
    return '\n    <div class="field-grid">\n      <label>\n        <span class="field-label">Categorie</span>\n        <select class="field-select" name="type">\n          '.concat(IMPROVEMENT_TYPES.map((type) => '<option value="'.concat(type.key, '" ').concat((item == null ? void 0 : item.type) === type.key ? "selected" : "", ">").concat(escapeHtml(type.label), "</option>")).join(""), '\n        </select>\n      </label>\n      <label class="field-span">\n        <span class="field-label">Remontee</span>\n        <input class="field-input" name="label" type="text" value="').concat(escapeHtml((_a = item == null ? void 0 : item.label) != null ? _a : ""), '">\n      </label>\n    </div>\n  ');
  }
  function renderDtfForm(dtf = null) {
    var _a, _b, _c, _d, _e, _f;
    return '\n    <div class="field-grid dtf-form-grid">\n      <label class="dtf-form-wide">\n        <span class="field-label">Client</span>\n        <input class="field-input" name="clientName" type="text" list="clientSuggestions" value="'.concat(escapeHtml(dtfClientLabel(dtf)), '">\n      </label>\n      <label>\n        <span class="field-label">Dimension</span>\n        <input class="field-input" name="dimensions" type="text" value="').concat(escapeHtml((_a = dtf == null ? void 0 : dtf.dimensions) != null ? _a : ""), '">\n      </label>\n      <label class="dtf-logo-field">\n        <span class="field-label">Nom du logo</span>\n        <div class="field-stack">\n          <input class="field-input" name="designName" type="text" value="').concat(escapeHtml((_b = dtf == null ? void 0 : dtf.designName) != null ? _b : ""), '" placeholder="Design perso ou logo existant">\n          <select class="field-select" name="designPreset">\n            ').concat(renderLogoPresetOptions(dtf == null ? void 0 : dtf.designName), '\n          </select>\n        </div>\n      </label>\n      <label>\n        <span class="field-label">Taille</span>\n        <input class="field-input" name="size" type="text" value="').concat(escapeHtml((_c = dtf == null ? void 0 : dtf.size) != null ? _c : ""), '">\n      </label>\n      <label>\n        <span class="field-label">Couleur</span>\n        <input class="field-input" name="color" type="text" list="dtfColorOptions" value="').concat(escapeHtml((_d = dtf == null ? void 0 : dtf.color) != null ? _d : ""), '">\n      </label>\n      <label>\n        <span class="field-label">Quantite</span>\n        <input class="field-input" name="quantity" type="number" min="1" value="').concat(Math.max(1, Number(dtf == null ? void 0 : dtf.quantity) || 1), '">\n      </label>\n      <label>\n        <span class="field-label">Type de client</span>\n        <select class="field-select" name="clientType">\n          <option value="perso" ').concat(((_e = dtf == null ? void 0 : dtf.clientType) != null ? _e : "perso") === "perso" ? "selected" : "", '>Perso</option>\n          <option value="pro" ').concat((dtf == null ? void 0 : dtf.clientType) === "pro" ? "selected" : "", '>Pro</option>\n        </select>\n      </label>\n      <label class="field-checkbox">\n        <span class="field-label">Type de demande</span>\n        <span class="checkbox-row">\n          <input name="needsMockup" type="checkbox" ').concat((dtf == null ? void 0 : dtf.needsMockup) ? "checked" : "", '>\n          <span>Maquette \xE0 faire</span>\n        </span>\n      </label>\n      <label class="dtf-form-note">\n        <span class="field-label">Note technique</span>\n        <input class="field-input" name="technicalNote" type="text" value="').concat(escapeHtml((_f = dtf == null ? void 0 : dtf.technicalNote) != null ? _f : ""), '">\n      </label>\n    </div>\n    <datalist id="clientSuggestions">').concat(renderClientSuggestionOptions(), '</datalist>\n    <datalist id="dtfColorOptions">').concat(renderListOptions(TEXTILE_COLOR_OPTIONS), "</datalist>\n  ");
  }
  function renderTextileOrderForm(order = null) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    return '\n    <div class="field-grid textile-form-grid">\n      <label>\n        <span class="field-label">Client</span>\n        <input class="field-input" name="clientName" type="text" list="clientSuggestions" value="'.concat(escapeHtml(textileClientLabel(order)), '">\n      </label>\n      <label>\n        <span class="field-label">Fournisseur</span>\n        <input class="field-input" name="supplier" type="text" list="textileSupplierOptions" value="').concat(escapeHtml((_a = order == null ? void 0 : order.supplier) != null ? _a : "Toptex"), '">\n      </label>\n      <label>\n        <span class="field-label">Marque</span>\n        <input class="field-input" name="brand" type="text" list="textileBrandOptions" value="').concat(escapeHtml((_b = order == null ? void 0 : order.brand) != null ? _b : ""), '">\n      </label>\n      <label>\n        <span class="field-label">Genre</span>\n        <input class="field-input" name="gender" type="text" list="textileGenderOptions" value="').concat(escapeHtml((_c = order == null ? void 0 : order.gender) != null ? _c : "-"), '">\n      </label>\n      <label>\n        <span class="field-label">Designation</span>\n        <input class="field-input" name="designation" type="text" list="textileDesignationOptions" value="').concat(escapeHtml((_d = order == null ? void 0 : order.designation) != null ? _d : ""), '">\n      </label>\n      <label>\n        <span class="field-label">R\xE9f\xE9rence</span>\n        <input class="field-input" name="catalogReference" type="text" list="textileReferenceOptions" value="').concat(escapeHtml((_e = order == null ? void 0 : order.catalogReference) != null ? _e : ""), '">\n      </label>\n      <label>\n        <span class="field-label">Couleur</span>\n        <input class="field-input" name="color" type="text" list="textileColorOptions" value="').concat(escapeHtml((_f = order == null ? void 0 : order.color) != null ? _f : ""), '">\n      </label>\n      <label>\n        <span class="field-label">Taille</span>\n        <input class="field-input" name="size" type="text" list="textileSizeOptions" value="').concat(escapeHtml((_g = order == null ? void 0 : order.size) != null ? _g : ""), '">\n      </label>\n      <label>\n        <span class="field-label">Quantite</span>\n        <input class="field-input" name="quantity" type="number" min="1" value="').concat(Math.max(1, Number(order == null ? void 0 : order.quantity) || 1), '">\n      </label>\n      <label>\n        <span class="field-label">Livraison</span>\n        <input class="field-input" name="deliveryStatus" type="text" list="textileDeliveryOptions" value="').concat(escapeHtml((_h = order == null ? void 0 : order.deliveryStatus) != null ? _h : "pending"), '">\n      </label>\n      <label>\n        <span class="field-label">Session</span>\n        <input class="field-input" name="sessionLabel" type="text" value="').concat(escapeHtml((_i = order == null ? void 0 : order.sessionLabel) != null ? _i : ""), '">\n      </label>\n      <label>\n        <span class="field-label">Date</span>\n        <input class="field-input" name="expectedDate" type="date" value="').concat(escapeHtml((_j = order == null ? void 0 : order.expectedDate) != null ? _j : ""), '">\n      </label>\n    </div>\n    <datalist id="clientSuggestions">').concat(renderClientSuggestionOptions(), '</datalist>\n    <datalist id="textileSupplierOptions">').concat(renderListOptions(TEXTILE_SUPPLIER_OPTIONS), '</datalist>\n    <datalist id="textileBrandOptions">').concat(renderTextileValueOptions("brand", TEXTILE_BRAND_OPTIONS), '</datalist>\n    <datalist id="textileGenderOptions">').concat(renderListOptions(TEXTILE_GENDER_OPTIONS), '</datalist>\n    <datalist id="textileDesignationOptions">').concat(renderTextileValueOptions("designation"), '</datalist>\n    <datalist id="textileReferenceOptions">').concat(renderTextileValueOptions("catalogReference"), '</datalist>\n    <datalist id="textileColorOptions">').concat(renderTextileValueOptions("color", TEXTILE_COLOR_OPTIONS), '</datalist>\n    <datalist id="textileSizeOptions">').concat(renderTextileValueOptions("size"), '</datalist>\n    <datalist id="textileDeliveryOptions">').concat(renderListOptions(TEXTILE_DELIVERY_OPTIONS), "</datalist>\n  ");
  }
  function renderClientSuggestionOptions() {
    return db.clients.filter((client) => !isSampleClient(client)).map((client) => '<option value="'.concat(escapeHtml(client.name), '"></option>')).join("");
  }
  function primaryClientContact(client) {
    var _a, _b;
    return (_b = (_a = client == null ? void 0 : client.contacts) == null ? void 0 : _a[0]) != null ? _b : { name: "", role: "", phone: "", email: "" };
  }
  function renderClientForm(client = null) {
    var _a, _b, _c, _d, _e, _f;
    const contact = primaryClientContact(client);
    return '\n    <div class="field-grid client-form-grid">\n      <label>\n        <span class="field-label">Soci\xE9t\xE9</span>\n        <input class="field-input" name="name" type="text" value="'.concat(escapeHtml((_a = client == null ? void 0 : client.name) != null ? _a : ""), '">\n      </label>\n      <label>\n        <span class="field-label">Ville</span>\n        <input class="field-input" name="city" type="text" value="').concat(escapeHtml((_b = client == null ? void 0 : client.city) != null ? _b : ""), '">\n      </label>\n      <label>\n        <span class="field-label">Code postal</span>\n        <input class="field-input" name="postalCode" type="text" value="').concat(escapeHtml((_c = client == null ? void 0 : client.postalCode) != null ? _c : ""), '">\n      </label>\n      <label>\n        <span class="field-label">Contact</span>\n        <input class="field-input" name="contactName" type="text" value="').concat(escapeHtml((_d = contact.name) != null ? _d : ""), '">\n      </label>\n      <label>\n        <span class="field-label">T\xE9l\xE9phone</span>\n        <input class="field-input" name="contactPhone" type="tel" value="').concat(escapeHtml((_e = contact.phone) != null ? _e : ""), '">\n      </label>\n      <label class="client-form-wide">\n        <span class="field-label">Email</span>\n        <input class="field-input" name="contactEmail" type="email" value="').concat(escapeHtml((_f = contact.email) != null ? _f : ""), '">\n      </label>\n    </div>\n  ');
  }
  function renderTestPlanningClientTypeChoices(selectedType = "") {
    const current = String(selectedType != null ? selectedType : "").trim().toUpperCase();
    return ["PRO", "PERSO"].map((type) => '\n    <label class="team-bubble-choice" aria-label="Client '.concat(type, '">\n      <input class="team-bubble-choice-input" type="radio" name="clientType" value="').concat(type, '" ').concat(current === type ? "checked" : "", '>\n      <span class="team-bubble ').concat(current === type ? "is-active" : "", '">').concat(type, "</span>\n    </label>\n  ")).join("");
  }
  function renderTestPlanningForm(item = null) {
    var _a, _b, _c, _d, _e, _f, _g;
    const stage = normalizeTestPlanningStage(item == null ? void 0 : item.stage);
    return '\n    <div class="test-planning-field-stage">\n      <span class="field-label">\xC9tape</span>\n      <select class="field-select" name="stage">\n        '.concat(TEST_PLANNING_STAGES.map((entry) => '<option value="'.concat(entry.key, '" ').concat(entry.key === stage ? "selected" : "", ">").concat(escapeHtml(entry.label), "</option>")).join(""), '\n      </select>\n    </div>\n    <div class="field-grid test-planning-form-grid">\n      <label class="test-planning-field-type">\n        <span class="field-label">Type</span>\n        <span class="team-bubble-group" aria-label="Type de client test planning">\n          ').concat(renderTestPlanningClientTypeChoices(item == null ? void 0 : item.clientType), '\n        </span>\n      </label>\n      <label class="test-planning-field-client">\n        <span class="field-label">Client</span>\n        <div class="autocomplete-wrap">\n          <input class="field-input" name="clientName" type="text" autocomplete="off" value="').concat(escapeHtml((_a = item == null ? void 0 : item.clientName) != null ? _a : ""), '" placeholder="CLIENT" data-autocomplete="testPlanningClient">\n          <div class="autocomplete-dropdown" id="testPlanningClientDropdown" hidden></div>\n        </div>\n      </label>\n      <label class="test-planning-field-family">\n        <span class="field-label">Famille</span>\n        <input class="field-input" name="family" type="text" list="testPlanningFamilyOptions" value="').concat(escapeHtml((_b = item == null ? void 0 : item.family) != null ? _b : ""), '" placeholder="Famille">\n      </label>\n      <label class="test-planning-field-product">\n        <span class="field-label">Produit</span>\n        <input class="field-input" name="product" type="text" list="testPlanningProductOptions" value="').concat(escapeHtml((_c = item == null ? void 0 : item.product) != null ? _c : ""), '" placeholder="Produit">\n      </label>\n      <label class="test-planning-field-quantity">\n        <span class="field-label">Qt\xE9</span>\n        <input class="field-input" name="quantity" type="text" value="').concat(escapeHtml((_d = item == null ? void 0 : item.quantity) != null ? _d : ""), '" placeholder="Qt\xE9">\n      </label>\n      <label class="test-planning-field-delivery">\n        <span class="field-label">Date de livraison</span>\n        <input class="field-input" name="deliveryDate" type="date" value="').concat(escapeHtml((_e = item == null ? void 0 : item.deliveryDate) != null ? _e : ""), '">\n      </label>\n      <label class="test-planning-field-mockup-toggle">\n        <span class="field-label">Maquette \xE0 faire</span>\n        <span class="checkbox-row">\n          <input name="needsMockup" type="checkbox" ').concat((item == null ? void 0 : item.needsMockup) ? "checked" : "", '>\n          <span>Activer</span>\n        </span>\n      </label>\n      <label class="test-planning-field-status">\n        <span class="field-label">\xC9tat</span>\n        <select class="field-select" name="status">\n          <option value="">\u2014 Choisir un \xE9tat \u2014</option>\n          ').concat(renderTestPlanningStatusOptgroups((_f = item == null ? void 0 : item.status) != null ? _f : ""), '\n        </select>\n      </label>\n      <label class="order-form-note">\n        <span class="field-label">Note</span>\n        <input class="field-input" name="note" type="text" value="').concat(escapeHtml((_g = item == null ? void 0 : item.note) != null ? _g : ""), '" placeholder="Note">\n      </label>\n      <label class="test-planning-field-assignee">\n        <span class="field-label">Assign\xE9</span>\n        <span class="team-bubble-group" aria-label="Assignation test planning">\n          ').concat((() => {
      const current = normalizeImportedAssignee(item == null ? void 0 : item.assignedTo);
      return ORDER_ASSIGNEES.map((assignee) => '\n    <label class="team-bubble-choice" aria-label="Assigner a '.concat(assignee, '">\n      <input class="team-bubble-choice-input" type="radio" name="assignedTo" value="').concat(assignee, '" ').concat(current === assignee ? "checked" : "", '>\n      <span class="team-bubble ').concat(current === assignee ? "is-active" : "", '">').concat(assignee, "</span>\n    </label>\n  ")).join("");
    })(), '\n        </span>\n      </label>\n    </div>\n    <datalist id="testPlanningFamilyOptions">').concat(renderListOptions(testPlanningCombinedOptions("family", TEST_PLANNING_FAMILY_OPTIONS)), '</datalist>\n    <datalist id="testPlanningProductOptions">').concat(renderListOptions(testPlanningCombinedOptions("product", TEST_PLANNING_PRODUCT_OPTIONS)), "</datalist>\n    <!-- status is now a <select> with optgroups -->\n  ");
  }
  function getVisibleClientRows() {
    const query = state.search;
    const rows = [];
    db.clients.forEach((client) => {
      var _a;
      if (isSampleClient(client)) {
        return;
      }
      const contacts = ((_a = client.contacts) == null ? void 0 : _a.length) ? client.contacts : [{ id: 1, name: "", role: "", phone: "", email: "" }];
      contacts.forEach((contact, index) => {
        var _a2, _b, _c, _d, _e;
        const haystack = [
          client.name,
          client.clientType,
          client.postalCode,
          client.city,
          contact.name,
          contact.role,
          contact.email,
          contact.phone
        ].join(" ").toLowerCase();
        if (!query || haystack.includes(query)) {
          rows.push({
            client,
            contact: {
              id: (_a2 = contact.id) != null ? _a2 : index + 1,
              name: (_b = contact.name) != null ? _b : "",
              role: (_c = contact.role) != null ? _c : "",
              phone: (_d = contact.phone) != null ? _d : "",
              email: (_e = contact.email) != null ? _e : ""
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
  function getProductionQuantity(item) {
    return Array.isArray(item == null ? void 0 : item.prints) && item.prints.length ? item.prints.length : Math.max(1, Number(item == null ? void 0 : item.quantity) || 1);
  }
  function getProductionCompletedCount(item) {
    return Array.isArray(item == null ? void 0 : item.prints) ? item.prints.filter((print) => print.checked).length : 0;
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
    if ("".concat(note.name, " ").concat(note.summary).toLowerCase().includes(state.search)) {
      return note.items;
    }
    return note.items.filter((item) => "".concat(note.name, " ").concat(item.label).toLowerCase().includes(state.search));
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
      ].join(" ").toLowerCase();
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
        meta: [item.dimensions, item.logoPlacement, item.color, item.size].filter(Boolean).join(" \xB7 "),
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
        title: [item.family, item.product].filter(Boolean).join(" \xB7 ") || "Commandes g\xE9n\xE9rales",
        meta: item.note || "",
        quantity: item.quantity ? Number(item.quantity) : 0,
        zone: "Commandes g\xE9n\xE9rales",
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
    ].join(" ").toLowerCase();
  }
  function mockupSortTime(value) {
    if (!value) {
      return Number.MAX_SAFE_INTEGER;
    }
    const normalized = String(value).includes("T") ? String(value) : "".concat(value, "T00:00:00");
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
      ].join(" ").toLowerCase();
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
      return "".concat(item.zone, " ").concat(item.label).toLowerCase().includes(state.search);
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
      return "".concat(improvementTypeLabel(item.type), " ").concat(item.label).toLowerCase().includes(state.search);
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
    const clones = db.dtfRequests.filter((item) => ids.includes(item.id)).map((item) => ({
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
    db.dtfRequests = db.dtfRequests.map((item) => ids.includes(item.id) ? { ...item, status } : item);
    persistDb();
    state.selectedDtfIds.clear();
    requestRender();
    showToast("Demandes mises a jour.");
  }
  function archiveDtfItems(ids, shouldArchive) {
    db.dtfRequests = db.dtfRequests.map((item) => ids.includes(item.id) ? { ...item, status: shouldArchive ? item.status : "draft", archivedAt: shouldArchive ? isoToday() : "" } : item);
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
    db.textileOrders = db.textileOrders.map((item) => item.id === id ? { ...item, archivedAt: shouldArchive ? isoToday() : "" } : item);
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
    const deliveryStatus = String((_a = item == null ? void 0 : item.deliveryStatus) != null ? _a : "").trim();
    return {
      ...item,
      clientId: Number(item == null ? void 0 : item.clientId) || null,
      clientName: String((_b = item == null ? void 0 : item.clientName) != null ? _b : "").trim(),
      supplier: String((_c = item == null ? void 0 : item.supplier) != null ? _c : "").trim(),
      brand: String((_d = item == null ? void 0 : item.brand) != null ? _d : "").trim(),
      gender: String((_e = item == null ? void 0 : item.gender) != null ? _e : "").trim(),
      designation: String((_f = item == null ? void 0 : item.designation) != null ? _f : "").trim(),
      catalogReference: String((_g = item == null ? void 0 : item.catalogReference) != null ? _g : "").trim(),
      color: String((_h = item == null ? void 0 : item.color) != null ? _h : "").trim(),
      size: String((_i = item == null ? void 0 : item.size) != null ? _i : "").trim(),
      quantity: Math.max(1, Number(item == null ? void 0 : item.quantity) || 1),
      deliveryStatus: TEXTILE_DELIVERY_OPTIONS.includes(deliveryStatus) ? deliveryStatus : "pending",
      sessionLabel: String((_j = item == null ? void 0 : item.sessionLabel) != null ? _j : "").trim(),
      expectedDate: String((_k = item == null ? void 0 : item.expectedDate) != null ? _k : isoToday()),
      archivedAt: String((_l = item == null ? void 0 : item.archivedAt) != null ? _l : ""),
      createdAt: String((_m = item == null ? void 0 : item.createdAt) != null ? _m : isoToday())
    };
  }
  function injectImportedTextileOrders(collection, clients, parsedVersion) {
    if (parsedVersion >= DATA_VERSION) {
      return collection;
    }
    const orders = deepClone(Array.isArray(collection) ? collection : []);
    const clientByName = new Map(
      (Array.isArray(clients) ? clients : []).map((client) => [normalizeClientKey(client == null ? void 0 : client.name), client.id])
    );
    const signatures = new Set(orders.map((item) => textileOrderSignature(item, clients)));
    TEXTILE_ORDER_IMPORTS.forEach((item) => {
      var _a;
      const importedOrder = normalizeTextileOrder({
        id: nextId(orders),
        clientId: (_a = clientByName.get(normalizeClientKey(item.clientName))) != null ? _a : null,
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
    var _a;
    const clientLabel = textileClientLabel(item, clients);
    return [
      normalizeSearchKey(clientLabel),
      normalizeSearchKey(item == null ? void 0 : item.supplier),
      normalizeSearchKey(item == null ? void 0 : item.brand),
      normalizeSearchKey(item == null ? void 0 : item.designation),
      normalizeSearchKey(item == null ? void 0 : item.catalogReference),
      normalizeSearchKey(item == null ? void 0 : item.color),
      normalizeSearchKey(item == null ? void 0 : item.size),
      String(Math.max(1, Number(item == null ? void 0 : item.quantity) || 1)),
      normalizeSearchKey(item == null ? void 0 : item.deliveryStatus),
      normalizeSearchKey(item == null ? void 0 : item.sessionLabel),
      String((_a = item == null ? void 0 : item.expectedDate) != null ? _a : "")
    ].join("|");
  }
  function resolveClientName(clientId, clients = db.clients) {
    var _a, _b;
    return (_b = (_a = (Array.isArray(clients) ? clients : []).find((client) => client.id === Number(clientId))) == null ? void 0 : _a.name) != null ? _b : "";
  }
  function textileClientLabel(item, clients = db.clients) {
    var _a;
    return String((_a = item == null ? void 0 : item.clientName) != null ? _a : "").trim() || resolveClientName(item == null ? void 0 : item.clientId, clients) || "Client inconnu";
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
    var _a;
    const parsedVersion = Number((_a = parsed == null ? void 0 : parsed._meta) == null ? void 0 : _a.version) || 0;
    const shouldResetCustomerOrders = parsedVersion > 0 && parsedVersion < 2;
    const clients = mergeImportedClients(Array.isArray(parsed.clients) ? parsed.clients : deepClone(seed.clients));
    const textileOrders = Array.isArray(parsed.textileOrders) ? parsed.textileOrders.map(normalizeTextileOrder) : deepClone(seed.textileOrders);
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
    const byName = /* @__PURE__ */ new Map();
    clients.forEach((client) => {
      const key = normalizeClientKey(client == null ? void 0 : client.name);
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
      normalizeSearchKey(contact == null ? void 0 : contact.name),
      normalizeSearchKey(contact == null ? void 0 : contact.role),
      normalizeSearchKey(contact == null ? void 0 : contact.phone),
      normalizeSearchKey(contact == null ? void 0 : contact.email)
    ].filter(Boolean).join("|");
  }
  function normalizeSearchKey(value) {
    return String(value != null ? value : "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
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
    readStorageBackups().slice().reverse().forEach((entry) => {
      if (entry == null ? void 0 : entry.payload) {
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
      var _a, _b, _c, _d, _e;
      const existing = rows.find((item) => {
        var _a2;
        return String((_a2 = item.name) != null ? _a2 : "").trim().toLowerCase() === name.toLowerCase();
      });
      const items = Array.isArray(existing == null ? void 0 : existing.items) ? existing.items : String((_a = existing == null ? void 0 : existing.body) != null ? _a : "").split("\n").map((line) => line.trim()).filter(Boolean).map((label, itemIndex) => ({
        id: itemIndex + 1,
        label,
        checked: false
      }));
      const normalizedItems = items.map((item, itemIndex) => {
        var _a2;
        return {
          id: Number(item.id) || itemIndex + 1,
          label: String((_a2 = item.label) != null ? _a2 : "").trim(),
          checked: Boolean(item.checked)
        };
      }).filter((item) => item.label);
      const fallbackItems = normalizedItems.length ? normalizedItems : ((_b = TEAM_NOTE_DEFAULT_ITEMS[name]) != null ? _b : []).map((label, itemIndex) => ({
        id: itemIndex + 1,
        label,
        checked: false
      }));
      const mergedItems = name === "Loic" ? mergeMissingTeamNoteItems(fallbackItems, (_c = TEAM_NOTE_DEFAULT_ITEMS.Loic) != null ? _c : []) : fallbackItems;
      return {
        id: index + 1,
        name,
        summary: String((_d = existing == null ? void 0 : existing.summary) != null ? _d : "").trim(),
        items: mergedItems,
        updatedAt: String((_e = existing == null ? void 0 : existing.updatedAt) != null ? _e : "") || (mergedItems.length ? isoToday() : "")
      };
    });
  }
  function mergeMissingTeamNoteItems(items, defaults) {
    const existingLabels = new Set(items.map((item) => {
      var _a;
      return String((_a = item.label) != null ? _a : "").trim().toLowerCase();
    }));
    const merged = [...items];
    let nextItemId = nextId(items);
    defaults.forEach((label) => {
      const normalizedLabel = String(label != null ? label : "").trim();
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
    return "".concat(noteId, ":").concat(itemId);
  }
  function startEditingTeamNoteItem(noteId, itemId) {
    state.activeTeamNoteEdit = teamNoteEditKey(noteId, itemId);
    requestRender({ header: false, status: false, view: true });
    requestAnimationFrame(() => {
      const input = refs.viewRoot.querySelector('.team-note-edit-input[data-note-id="'.concat(noteId, '"][data-item-id="').concat(itemId, '"]'));
      if (input) {
        autosizeTextarea(input);
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });
  }
  function saveTeamNoteItem(noteId, itemId, nextLabel) {
    const note = db.teamNotes.find((item) => item.id === noteId);
    const entry = note == null ? void 0 : note.items.find((item) => item.id === itemId);
    if (!entry) {
      state.activeTeamNoteEdit = null;
      requestRender({ header: false, status: false, view: true });
      return;
    }
    const label = String(nextLabel != null ? nextLabel : "").trim();
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
    const entry = note == null ? void 0 : note.items.find((item) => item.id === itemId);
    const label = String(nextLabel != null ? nextLabel : "");
    if (!entry || !label.trim() || entry.label === label) {
      return;
    }
    entry.label = label;
    note.updatedAt = isoToday();
    persistDb();
  }
  function syncTeamNoteSummary(noteId, nextSummary) {
    const note = db.teamNotes.find((item) => item.id === noteId);
    const summary = String(nextSummary != null ? nextSummary : "");
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
    textarea.style.height = "".concat(textarea.scrollHeight, "px");
  }
  function syncTeamNoteEditors() {
    refs.viewRoot.querySelectorAll(".team-note-edit-input, .team-note-summary-input").forEach((node) => {
      autosizeTextarea(node);
    });
  }
  function normalizeDtfRequest(item) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
    const legacyDimensions = String((_a = item.dimensions) != null ? _a : "").trim();
    const legacyFront = String((_b = item.dimensionFront) != null ? _b : "").trim();
    const legacyBack = String((_c = item.dimensionBack) != null ? _c : "").trim();
    return {
      id: Number(item.id),
      sourceOrderId: Number(item.sourceOrderId) || null,
      clientId: Number(item.clientId) || null,
      clientName: String((_d = item.clientName) != null ? _d : "").trim(),
      dimensions: legacyDimensions || legacyFront || legacyBack,
      logoPlacement: normalizeLogoPlacement(item.logoPlacement || (legacyBack && !legacyFront ? "AR" : "AV")),
      designName: String((_e = item.designName) != null ? _e : ""),
      size: String((_f = item.size) != null ? _f : ""),
      color: String((_g = item.color) != null ? _g : ""),
      technicalNote: String((_h = item.technicalNote) != null ? _h : ""),
      quantity: Math.max(1, Number(item.quantity) || 1),
      needsMockup: Boolean(item.needsMockup),
      mockupCompletedAt: String((_i = item.mockupCompletedAt) != null ? _i : ""),
      clientType: String((_j = item.clientType) != null ? _j : "perso"),
      status: String((_k = item.status) != null ? _k : "draft"),
      archivedAt: String((_l = item.archivedAt) != null ? _l : ""),
      createdAt: String((_m = item.createdAt) != null ? _m : isoToday())
    };
  }
  function normalizeProductionItem(item) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const rawPrints = Array.isArray(item.prints) ? item.prints : Array.from({ length: quantity }, (_, index) => ({
      id: index + 1,
      checked: false
    }));
    return {
      id: Number(item.id),
      clientType: String((_a = item.clientType) != null ? _a : "perso"),
      label: String((_c = (_b = item.label) != null ? _b : item.name) != null ? _c : "").trim(),
      reference: String((_d = item.reference) != null ? _d : "").trim(),
      size: String((_e = item.size) != null ? _e : "").trim(),
      prints: rawPrints.map((print, index) => ({
        id: Number(print.id) || index + 1,
        checked: Boolean(print.checked)
      })),
      status: normalizeProductionStatus(item.status),
      errorNote: String((_g = (_f = item.errorNote) != null ? _f : item.error) != null ? _g : "").trim(),
      createdAt: String((_h = item.createdAt) != null ? _h : isoNow()),
      updatedAt: String((_j = (_i = item.updatedAt) != null ? _i : item.createdAt) != null ? _j : isoNow())
    };
  }
  function normalizeWorkshopTask(item, index = 0) {
    var _a, _b, _c;
    return {
      id: Number(item.id) || index + 1,
      group: String((_a = item.group) != null ? _a : "standard"),
      label: String((_b = item.label) != null ? _b : "").trim(),
      checked: Boolean(item.checked),
      recurring: Boolean(item.recurring),
      createdAt: String((_c = item.createdAt) != null ? _c : isoToday())
    };
  }
  function normalizeImprovementItem(item, index = 0) {
    var _a, _b, _c;
    const type = String((_a = item.type) != null ? _a : "bug");
    return {
      id: Number(item.id) || index + 1,
      type: IMPROVEMENT_TYPES.some((entry) => entry.key === type) ? type : "bug",
      label: String((_b = item.label) != null ? _b : "").trim(),
      createdAt: String((_c = item.createdAt) != null ? _c : isoToday())
    };
  }
  function normalizeTestPlanningItem(item, index = 0) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
    const stage = normalizeTestPlanningStage(item.stage);
    return {
      id: Number(item.id) || index + 1,
      clientType: String((_a = item.clientType) != null ? _a : "").trim().toUpperCase(),
      clientId: Number(item.clientId) || null,
      clientName: String((_b = item.clientName) != null ? _b : "").trim().toUpperCase(),
      family: String((_c = item.family) != null ? _c : "").trim().toUpperCase(),
      product: String((_d = item.product) != null ? _d : "").trim().toUpperCase(),
      quantity: String((_e = item.quantity) != null ? _e : "").trim(),
      note: String((_f = item.note) != null ? _f : "").trim(),
      deliveryDate: String((_g = item.deliveryDate) != null ? _g : "").trim(),
      needsMockup: Boolean(item.needsMockup),
      mockupStatus: String((_h = item.mockupStatus) != null ? _h : "").trim(),
      mockupCompletedAt: String((_i = item.mockupCompletedAt) != null ? _i : ""),
      status: String((_j = item.status) != null ? _j : "").trim(),
      stage,
      assignedTo: normalizeImportedAssignee(item.assignedTo),
      createdAt: String((_k = item.createdAt) != null ? _k : isoNow())
    };
  }
  function mergeWorkshopDefaults(collection) {
    const tasks = (Array.isArray(collection) ? collection : []).map((item, index) => normalizeWorkshopTask(item, index)).filter((item) => item.label);
    const seen = new Set(tasks.map((item) => "".concat(item.group, "|").concat(normalizeSearchKey(item.label))));
    let nextTaskId = nextId(tasks);
    DEFAULT_WORKSHOP_TASKS.forEach((task) => {
      const key = "".concat(task.group, "|").concat(normalizeSearchKey(task.label));
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
    var _a, _b, _c, _d;
    return {
      id: Number(item.id) || index + 1,
      zone: String((_a = item.zone) != null ? _a : "SXM"),
      label: String((_b = item.label) != null ? _b : "").trim(),
      quantity: Math.max(1, Number(item.quantity) || 1),
      checked: Boolean(item.checked),
      createdAt: String((_c = item.createdAt) != null ? _c : isoToday()),
      deletedAt: String((_d = item.deletedAt) != null ? _d : "")
    };
  }
  function mergePurchaseDefaults(collection) {
    const items = (Array.isArray(collection) ? collection : []).map((item, index) => normalizePurchaseItem(item, index)).filter((item) => item.label);
    const seen = new Set(items.map((item) => "".concat(item.zone, "|").concat(normalizeSearchKey(item.label))));
    let nextPurchaseId = nextId(items);
    DEFAULT_PURCHASE_ITEMS.forEach((item) => {
      const key = "".concat(item.zone, "|").concat(normalizeSearchKey(item.label));
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
      const backupKey = "".concat(STORAGE_KEY, ".corrupt.").concat(Date.now());
      localStorage.setItem(backupKey, raw);
      localStorage.removeItem(STORAGE_KEY);
    } catch {
    }
  }
  function normalizeImportedAssignee(value) {
    const normalized = String(value != null ? value : "").trim().toUpperCase();
    return ORDER_ASSIGNEES.includes(normalized) ? normalized : "";
  }
  function normalizeProductionStatus(value) {
    const raw = String(value != null ? value : "").trim().toLowerCase();
    if (raw === "impression en cours" || raw === "en cours") {
      return "Impression en cours";
    }
    if (raw === "erreur") {
      return "Erreur";
    }
    if (raw === "termine" || raw === "termin\xE9") {
      return "Termin\xE9";
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
        const record2 = await response.json();
        remoteRevision = Math.max(0, Number(record2.revision) || 0);
        const localSnapshot = buildDbSnapshot();
        applyRemoteDbRecord(record2, { announce: false });
        mergeLocalChangesBack(localSnapshot);
        persistDb();
        showToast("Donnees synchronisees avec le serveur.");
        return;
      }
      if (!response.ok) {
        throw new Error("Remote save failed with status ".concat(response.status));
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
      "testPlanningItems",
      "orders",
      "dtfRequests",
      "textileOrders",
      "purchaseItems",
      "workshopTasks",
      "improvementItems"
    ];
    for (var c = 0; c < collections.length; c++) {
      var key = collections[c];
      var localItems = localSnapshot[key];
      var remoteItems = db[key];
      if (!Array.isArray(localItems) || !Array.isArray(remoteItems)) continue;
      for (var i = 0; i < localItems.length; i++) {
        var localItem = localItems[i];
        if (!localItem || !localItem.id) continue;
        var remoteItem = remoteItems.find(function(r) {
          return r.id === localItem.id;
        });
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
    return "".concat(action, ":").concat(id != null ? id : "new");
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
    var _a;
    const key = sheetDraftStorageKey(action, (_a = options.id) != null ? _a : null);
    const draft = readSheetDrafts()[key];
    if (!(draft == null ? void 0 : draft.values)) {
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
      var _a, _b;
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
        field.checked = field.value === String((_a = values[field.name]) != null ? _a : "");
        return;
      }
      field.value = String((_b = values[field.name]) != null ? _b : "");
    });
  }
  function nextId(collection, start = 1) {
    return collection.reduce((max, item) => Math.max(max, Number(item.id) || 0), start - 1) + 1;
  }
  function clientName(clientId) {
    var _a, _b;
    return (_b = (_a = db.clients.find((client) => client.id === clientId)) == null ? void 0 : _a.name) != null ? _b : "Client inconnu";
  }
  function isSampleClient(client) {
    var _a;
    return SAMPLE_CLIENT_NAMES.has(String((_a = client == null ? void 0 : client.name) != null ? _a : "").trim());
  }
  function dtfClientLabel(item) {
    if (item == null ? void 0 : item.clientName) {
      return item.clientName;
    }
    if (item == null ? void 0 : item.clientId) {
      return clientName(item.clientId);
    }
    return "Client inconnu";
  }
  function teamNoteTone(name) {
    var _a;
    const tones = {
      Loic: "cool-1",
      Charlie: "cool-2",
      Melina: "cool-3",
      Amandine: "cool-4"
    };
    return (_a = tones[String(name != null ? name : "").trim()]) != null ? _a : "cool-1";
  }
  function normalizeTestPlanningStage(value) {
    const stage = String(value != null ? value : "").trim();
    return TEST_PLANNING_STAGE_KEYS.includes(stage) ? stage : TEST_PLANNING_DEFAULT_STAGE;
  }
  function initTestPlanningClientAutocomplete() {
    const input = refs.sheetBody.querySelector('[data-autocomplete="testPlanningClient"]');
    const dropdown = refs.sheetBody.querySelector("#testPlanningClientDropdown");
    if (!input || !dropdown) return;
    const clientNames = db.clients.filter((c) => !isSampleClient(c)).map((c) => {
      var _a;
      return String((_a = c.name) != null ? _a : "").toUpperCase();
    }).filter(Boolean).sort();
    function showSuggestions(query) {
      const q = query.toUpperCase().trim();
      const matches = q ? clientNames.filter((n) => n.includes(q)) : clientNames.slice(0, 40);
      if (!matches.length) {
        dropdown.hidden = true;
        return;
      }
      dropdown.innerHTML = matches.map((name) => '<div class="autocomplete-option" tabindex="-1">'.concat(escapeHtml(name), "</div>")).join("");
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
    input.addEventListener("blur", () => {
      setTimeout(() => {
        dropdown.hidden = true;
      }, 150);
    });
    input.addEventListener("keydown", (e) => {
      var _a;
      if (dropdown.hidden) return;
      const options = [...dropdown.querySelectorAll(".autocomplete-option")];
      if (e.key === "ArrowDown") {
        e.preventDefault();
        (_a = options[0]) == null ? void 0 : _a.focus();
      } else if (e.key === "Escape") {
        dropdown.hidden = true;
      }
    });
    dropdown.addEventListener("mousedown", (e) => {
      const opt = e.target.closest(".autocomplete-option");
      if (!opt) return;
      e.preventDefault();
      selectOption(opt.textContent);
    });
    dropdown.addEventListener("keydown", (e) => {
      var _a, _b;
      const options = [...dropdown.querySelectorAll(".autocomplete-option")];
      const idx = options.indexOf(document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        (_a = options[idx + 1] || options[0]) == null ? void 0 : _a.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        idx <= 0 ? input.focus() : (_b = options[idx - 1]) == null ? void 0 : _b.focus();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (idx >= 0) selectOption(options[idx].textContent);
      } else if (e.key === "Escape") {
        dropdown.hidden = true;
        input.focus();
      }
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
      statusField.innerHTML = '<option value="">\u2014 Choisir un \xE9tat \u2014</option>' + renderTestPlanningStatusOptgroups(currentStatus);
    }
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
      field.placeholder = "Non utilis\xE9e";
    } else if (!field.value.trim()) {
      field.placeholder = "\xC0 faire ou OK";
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
        return '<option value="' + escapeHtml(s) + '"' + sel + ">" + escapeHtml(s) + "</option>";
      }).join("");
      return '<optgroup label="' + escapeHtml(stage.label) + '">' + opts + "</optgroup>";
    }).join("");
  }
  function handleInlineStatusEvent(sel) {
    var itemId = Number(sel.dataset.inlineStatusSel);
    var item = db.testPlanningItems.find(function(e) {
      return e.id === itemId;
    });
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
    return String(value != null ? value : "").trim().toUpperCase() === "AR" ? "AR" : "AV";
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
    if (status === "Termin\xE9") {
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
    return PRODUCTION_STATUS_OPTIONS.map((status) => '\n    <option value="'.concat(escapeHtml(status), '" ').concat(status === selectedStatus ? "selected" : "", ">").concat(escapeHtml(status), "</option>\n  ")).join("");
  }
  function renderListOptions(options) {
    return options.filter(Boolean).map((option) => '<option value="'.concat(escapeHtml(String(option)), '"></option>')).join("");
  }
  function improvementTypeLabel(type) {
    var _a, _b;
    return (_b = (_a = IMPROVEMENT_TYPES.find((item) => item.key === type)) == null ? void 0 : _a.label) != null ? _b : "Bug";
  }
  function renderLogoPresetOptions(selectedValue = "") {
    const current = String(selectedValue != null ? selectedValue : "").trim();
    const knownValues = /* @__PURE__ */ new Set([...FRONT_LOGO_OPTIONS, ...BACK_LOGO_OPTIONS]);
    const customOption = current && !knownValues.has(current) ? '<option value="'.concat(escapeHtml(current), '" selected>').concat(escapeHtml(current), "</option>") : '<option value="" '.concat(current ? "" : "selected", ">Choisir</option>");
    return "\n    ".concat(customOption, '\n    <optgroup label="Avant">\n      ').concat(FRONT_LOGO_OPTIONS.map((option) => '<option value="'.concat(escapeHtml(option), '" ').concat(option === current ? "selected" : "", ">").concat(escapeHtml(option), "</option>")).join(""), '\n    </optgroup>\n    <optgroup label="Arriere">\n      ').concat(BACK_LOGO_OPTIONS.map((option) => '<option value="'.concat(escapeHtml(option), '" ').concat(option === current ? "selected" : "", ">").concat(escapeHtml(option), "</option>")).join(""), "\n    </optgroup>\n  ");
  }
  function inferLogoPlacement(designName, fallback = "AV") {
    const current = String(designName != null ? designName : "").trim();
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
      var _a;
      const value = String((_a = item == null ? void 0 : item[key]) != null ? _a : "").trim();
      if (value) {
        values.add(value);
      }
    });
    return [...values].sort((left, right) => left.localeCompare(right, "fr")).map((value) => '<option value="'.concat(escapeHtml(value), '"></option>')).join("");
  }
  function parseOrderClient(value) {
    const raw = String(value != null ? value : "").trim();
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
    var _a;
    const parsed = parseOrderClient(value);
    return {
      clientId: parsed.clientId,
      clientName: String((_a = parsed.clientName) != null ? _a : "").trim().toUpperCase()
    };
  }
  function primaryLabel(action) {
    var _a;
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
      addWorkshopTask: "+ Ajouter une t\xE2che",
      editWorkshopTask: "Modifier la t\xE2che",
      editImprovementItem: "Modifier la remont\xE9e"
    };
    return (_a = labels[action]) != null ? _a : "+ Ajouter";
  }
  function submitLabel(action) {
    var _a;
    const labels = {
      addClient: "Cr\xE9er le client",
      addDtf: "Cr\xE9er la demande",
      editDtf: "Enregistrer",
      addTestPlanningOrder: "Cr\xE9er la commande",
      editTestPlanningOrder: "Enregistrer",
      addTextileOrder: "Cr\xE9er la commande",
      editTextileOrder: "Enregistrer",
      addProductionItem: "Ajouter le PRT",
      addPurchaseItem: "Ajouter l'article",
      editPurchaseItem: "Enregistrer",
      addWorkshopTask: "Ajouter la t\xE2che",
      editWorkshopTask: "Enregistrer",
      editImprovementItem: "Enregistrer"
    };
    return (_a = labels[action]) != null ? _a : "Enregistrer";
  }
  function sheetEyebrow(action) {
    var _a;
    const labels = {
      addClient: "Clients Pro",
      addDtf: "Demande DTF",
      editDtf: "Demande DTF",
      addTestPlanningOrder: "Commandes g\xE9n\xE9rales",
      editTestPlanningOrder: "Commandes g\xE9n\xE9rales",
      addTextileOrder: "Achat Textile",
      editTextileOrder: "Achat Textile",
      addProductionItem: "Production",
      addPurchaseItem: "Achat",
      editPurchaseItem: "Achat",
      addWorkshopTask: "Gestion d'atelier",
      editWorkshopTask: "Gestion d'atelier",
      editImprovementItem: "Am\xE9liorations"
    };
    return (_a = labels[action]) != null ? _a : "Cr\xE9ation";
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
      return "\u2014";
    }
    try {
      const raw = String(value).trim();
      const dateStr = raw.includes("T") ? raw : "".concat(raw, "T00:00:00");
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) {
        return "\u2014";
      }
      return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(date);
    } catch (e) {
      return "\u2014";
    }
  }
  function isoToday() {
    const now = /* @__PURE__ */ new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return "".concat(year, "-").concat(month, "-").concat(day);
  }
  function isoNow() {
    const now = /* @__PURE__ */ new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return "".concat(year, "-").concat(month, "-").concat(day, "T").concat(hours, ":").concat(minutes);
  }
  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
})();
