// Il grafico del cruscotto: visite e ordini nello stesso chart, cosi' si vede
// se il traffico si trasforma in ordini. Riusa il chart del modulo Analytics e
// le stesse chiamate delle tile (deduplicate da `cache`): zero query in piu'.
import {
  TrafficChart,
  type OrdersPoint,
} from "@/components/analytics/TrafficChart";
import { Card } from "@/components/ui";
import { orders30d, overview30d } from "./tiles";

// Una riga per giorno dalle righe ordine: `listOrders` le restituisce gia',
// non serve un endpoint nuovo. I giorni senza ordini li zero-fila il chart.
function byDay(orders: Array<{ created: string; totalGross: number }>): OrdersPoint[] {
  const map = new Map<string, OrdersPoint>();
  for (const o of orders) {
    const date = o.created.slice(0, 10);
    const row = map.get(date) ?? { date, orders: 0, revenue: 0 };
    row.orders += 1;
    row.revenue += o.totalGross;
    map.set(date, row);
  }
  return [...map.values()];
}

export async function TrafficSection() {
  const [data, ordersRes] = await Promise.all([overview30d(), orders30d()]);

  if (!data) {
    return (
      <Card padding="md">
        <p className="text-sm text-[var(--color-ink-muted)]">
          Analytics non disponibile. Controlla la connessione PostHog in
          Impostazioni.
        </p>
      </Card>
    );
  }

  return (
    <TrafficChart
      points={data.timeseries}
      orders={ordersRes ? byDay(ordersRes.orders) : undefined}
      app="all"
      from={data.from}
      to={data.to}
      granularity={data.granularity}
    />
  );
}
