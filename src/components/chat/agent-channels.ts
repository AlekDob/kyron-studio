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
      analyze_documents: "Controllo documenti",
      propose_decision: "Proposta",
    },
  },
  portals: {
    endpoint: "/api/agent/onboard-school",
    intro:
      "Sono Livia: muovo la lista portali qui a fianco e apro le schede — catalogo, kit, sconti, logo, pubblicazione. E se serve creo un portale nuovo passo per passo.",
    suggestions: [
      "Mostrami le bozze",
      "I portali di Bari",
      "Apri il portale massari",
      "Creiamo un portale nuovo",
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
  // Modulo Prodotti (Teo). Sul filo lo `scope` resta "catalogo": e' il nome
  // del ramo lato server (prompt + tool), non il nome dell'agente.
  products: {
    endpoint: "/api/agent/commesso",
    intro:
      "Sono Teo: muovo la lista prodotti qui a fianco e scrivo sul catalogo — nomi, giacenze, prezzi, pubblicazione sui portali. I prezzi passano sempre da un piano che ti mostro prima. Per gli ordini c'e' Nico, nel modulo Ordini.",
    suggestions: [
      "Mostrami gli iPad",
      "Cambia la descrizione di questo prodotto",
      "Porta il prezzo a 810 sul main shop",
      "Quanti pezzi abbiamo in magazzino",
      "Controlla i prezzi di tutti i portali",
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
    },
  },
  // Stesso endpoint di Teo: cambia solo lo `scope` nel body, che lato server
  // sceglie prompt e tool. Qui Nico vede solo ordini e comunicazioni ai
  // clienti; il pannello a fianco e' la lista vera.
  orders: {
    endpoint: "/api/agent/commesso",
    intro:
      "Filtro la lista ordini qui a fianco e ti dico cosa vedo. Posso anche mandare una comunicazione ai clienti partendo da un export di DDT di Danea.",
    suggestions: [
      "Mostrami gli ordini da confermare",
      "Ordini del portale massari",
      "Ordini di Ravelli di questo mese",
      "Apri l'ordine 495",
      "Manda una comunicazione sui ritardi di consegna",
    ],
    toolLabels: {
      list_orders: "Ordini",
      get_order: "Ordine",
      set_order_status: "Stato ordine",
      render_danea_uploader: "File Danea",
      parse_ddt_summary: "Lettura DDT",
      plan_ddt_mailing: "Piano comunicazione",
      send_ddt_mailing: "Invio comunicazione",
    },
  },
  // Modulo Clienti (Bea). Il pannello a fianco e' la lista vera dei clienti:
  // qui dentro si filtra e si scrive, non si elenca.
  customers: {
    endpoint: "/api/agent/customers",
    intro:
      "Sono Bea: filtro la lista clienti qui a fianco e apro le schede. Posso anche scrivere ai clienti, con lo stesso motore di invio di Nico.",
    suggestions: [
      "Clienti che hanno ordinato piu' di una volta",
      "Chi ha speso piu' di 1000 euro",
      "Apri la scheda di un cliente",
      "Manda una comunicazione ai clienti del portale massari",
    ],
    toolLabels: {
      list_customers: "Clienti",
      get_customer: "Cliente",
      customer_orders: "Ordini del cliente",
      plan_customer_mailing: "Piano comunicazione",
      send_customer_test_mail: "Mail di prova",
      send_customer_mailing: "Invio comunicazione",
    },
  },
  requests: {
    endpoint: "/api/agent/requests",
    intro:
      "Sono Ivo: mi dici cosa ti serve, ti faccio due domande e apro la richiesta ad Alek. Qui a fianco vedi tutte quelle gia' aperte e a che punto sono.",
    suggestions: [
      "Ho trovato un problema",
      "Mi servirebbe una cosa nuova",
      "A che punto sono le mie richieste",
      "Cosa c'e' ancora da fare",
    ],
    toolLabels: {
      list_requests: "Richieste",
      draft_request: "Bozza richiesta",
      create_request: "Apertura richiesta",
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
