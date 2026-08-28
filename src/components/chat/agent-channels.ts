// Cosa dice ogni canale quando lo apri: endpoint, presentazione, prime
// domande e nomi leggibili dei tool. Unica fonte per la chat a canale.

export interface ChannelConfig {
  endpoint: string;
  intro: string;
  suggestions: string[];
  toolLabels: Record<string, string>;
}

export const CHANNELS: Record<string, ChannelConfig> = {
  stats: {
    endpoint: "/api/agent/stats",
    intro:
      "Ti do i numeri del sito e dello shop (PostHog) e l'andamento delle campagne Meta. Solo lettura.",
    suggestions: [
      "Come è andata questa settimana",
      "Come vanno le campagne Meta",
      "Quante visite ha portato la pubblicità",
      "Ordini per portale a luglio",
    ],
    toolLabels: {
      overview: "Cruscotto",
      run_hogql: "Query PostHog",
      list_portals: "Portali",
      get_meta_campaigns: "Campagne Meta",
      get_meta_campaign_detail: "Dettaglio campagna",
    },
  },
  "vat-relief": {
    endpoint: "/api/agent/vat-relief",
    intro:
      "Carica i documenti 104 e ti dico se il fascicolo e' completo o cosa manca. Se mi dai il numero d'ordine confronto anche intestatario e prodotti. La decisione finale resta tua.",
    suggestions: [
      "Carico i documenti di una richiesta",
      "Controlla i documenti dell'ordine 326",
      "Cosa serve per l'IVA al 4%",
    ],
    toolLabels: {
      render_doc_uploader: "Carica documenti",
      get_order: "Ordine",
      analyze_documents: "Controllo documenti",
      propose_decision: "Proposta",
    },
  },
  portals: {
    endpoint: "/api/agent/onboard-school",
    intro:
      "Creo un nuovo portale scuola passo per passo, o ti mostro e sistemo quelli esistenti: catalogo, kit, sconti, logo, pubblicazione.",
    suggestions: [
      "Creiamo un portale nuovo",
      "Mostrami i portali esistenti",
      "Apri il portale massari",
    ],
    toolLabels: {
      check_slug_availability: "Verifica slug",
      validate_school_data: "Verifica dati scuola",
      list_portals: "Portali",
      get_portal: "Portale",
      save_pending_school: "Salvataggio portale",
      set_portal_status: "Stato portale",
      update_portal: "Modifica portale",
      delete_portal: "Eliminazione portale",
      render_product_picker: "Catalogo",
      render_bundle_builder: "Kit",
      render_logo_uploader: "Logo",
      add_bundle_to_portal: "Aggiunta kit",
      update_bundle: "Modifica kit",
      remove_bundle: "Rimozione kit",
      update_catalog: "Catalogo portale",
      update_discounts: "Sconti",
      apply_to_saleor: "Pubblicazione su Saleor",
    },
  },
  catalogo: {
    endpoint: "/api/agent/commesso",
    intro:
      "Gestisco catalogo e ordini: prodotti, giacenze, prezzi, stato delle lavorazioni. Posso anche mandare una comunicazione ai clienti partendo da un export di DDT di Danea. Prezzi e mail passano sempre da un piano che ti mostro prima.",
    suggestions: [
      "Mostrami gli iPad",
      "Cambia la descrizione di questo prodotto",
      "Porta il prezzo a 810 sul main shop",
      "Quanti pezzi abbiamo in magazzino",
      "Controlla i prezzi di tutti i portali",
      "Ordini di questa settimana",
      "Manda una comunicazione sui ritardi di consegna",
    ],
    toolLabels: {
      list_products: "Catalogo",
      get_product: "Prodotto",
      get_catalog_meta: "Canali e categorie",
      create_product: "Nuovo prodotto",
      update_product: "Modifica prodotto",
      update_variant: "Variante",
      set_stock: "Giacenza",
      add_product_image: "Immagine",
      publish_product: "Pubblicazione",
      plan_prices: "Piano prezzi",
      apply_price_plan: "Applicazione prezzi",
      run_all_checks: "Controllo tutti i portali",
      check_portal: "Controllo portale",
      render_danea_uploader: "File Danea",
      plan_danea_import: "Piano import",
      apply_danea_import: "Import prodotti",
      add_to_portals: "Aggiungi ai portali",
      list_orders: "Ordini",
      get_order: "Ordine",
      set_order_status: "Stato ordine",
      parse_ddt_summary: "Lettura DDT",
      plan_ddt_mailing: "Piano comunicazione",
      send_ddt_mailing: "Invio comunicazione",
    },
  },
  // Vera ha il suo loop di messaggi (proposte di annotazione): del canale usa
  // solo header e nomi dei tool, intro e suggerimenti restano per simmetria.
  preview: {
    endpoint: "/api/agent/review-editor",
    intro:
      "Guardo con te le pagine del sito: seleziona un pezzo e ti scrivo l'annotazione da mandare in revisione.",
    suggestions: [
      "Cosa non funziona in questa pagina",
      "Riscrivi questo titolo",
      "Mostrami tutte le annotazioni",
    ],
    toolLabels: {
      propose_annotation: "Proposta annotazione",
      add_annotation: "Annotazione",
      request_send_bundle: "Invio revisione",
    },
  },
};
