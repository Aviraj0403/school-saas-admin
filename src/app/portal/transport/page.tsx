'use client';

import React from 'react';
import { Bus, MapPin, Navigation, Phone } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import { EmptyBlock, QueryState } from '@/components/portal/QueryState';
import { Badge } from '@/components/ui/badge';
import { useStudentTransport, useVehicleLocation } from '@/hooks/queries/useFamily';

function TransportView({ studentId }: { studentId: string }) {
  const query = useStudentTransport(studentId);
  const route = query.data?.route;
  const vehicle = route?.vehicle;
  const loc = useVehicleLocation(vehicle?.id);
  const stops: any[] = route?.stops ?? [];
  const pickupId = query.data?.stopId;

  return (
    <QueryState
      query={query}
      isEmpty={!query.data}
      emptyText="This child is not assigned to a school bus route."
      emptyIcon={Bus}
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-400">Route</p>
            <h3 className="font-display text-lg font-semibold">{route?.name}</h3>
            <p className="text-xs text-zinc-500">
              {[
                route?.morningStart && `Morning ${route.morningStart}`,
                route?.eveningStart && `Evening ${route.eveningStart}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          {vehicle && (
            <div className="space-y-1 text-sm">
              <p className="font-semibold">
                {vehicle.vehicleNo}{' '}
                <span className="font-normal capitalize text-zinc-500">({vehicle.type})</span>
              </p>
              {vehicle.driverName && (
                <p className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                  <Phone className="size-4" /> {vehicle.driverName}
                  {vehicle.driverPhone && (
                    <a className="text-brand" href={`tel:${vehicle.driverPhone}`}>
                      {vehicle.driverPhone}
                    </a>
                  )}
                </p>
              )}
              {vehicle.attendantName && (
                <p className="text-xs text-zinc-500">
                  Attendant: {vehicle.attendantName} {vehicle.attendantPhone ?? ''}
                </p>
              )}
            </div>
          )}

          <div className="rounded-xl bg-zinc-50 p-4 dark:bg-white/[0.03]">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Navigation className="size-4" /> Live location
            </p>
            {loc.isPending && vehicle ? (
              <p className="text-sm text-zinc-500">Locating the bus…</p>
            ) : loc.isError ? (
              <p className="text-sm text-zinc-500">Live location is unavailable right now.</p>
            ) : loc.data ? (
              <div className="space-y-2 text-sm">
                <p className="text-zinc-500">
                  Last updated {new Date(loc.data.recordedAt).toLocaleTimeString('en-IN')}
                  {loc.data.speed != null && ` · ${Math.round(loc.data.speed)} km/h`}
                </p>
                <a
                  className="inline-flex items-center gap-1.5 font-semibold text-brand hover:underline"
                  href={`https://www.google.com/maps?q=${loc.data.lat},${loc.data.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="size-4" /> Open in Maps
                </a>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">The bus has not shared its location yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6 xl:col-span-2">
          <h3 className="mb-4 font-display text-lg font-semibold">Stops</h3>
          {stops.length === 0 ? (
            <p className="text-sm text-zinc-500">No stops have been added to this route.</p>
          ) : (
            <ol className="space-y-2">
              {stops.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3 text-sm"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
                      {s.sequence}
                    </span>
                    <span className="font-medium">{s.name}</span>
                    {pickupId && pickupId === s.id && <Badge variant="success">Pickup stop</Badge>}
                  </span>
                  <span className="flex items-center gap-4 text-xs text-zinc-500">
                    {s.morningTime && <span>AM {s.morningTime}</span>}
                    {s.eveningTime && <span>PM {s.eveningTime}</span>}
                    {s.lat != null && s.lng != null && (
                      <a
                        className="text-brand hover:underline"
                        href={`https://www.google.com/maps?q=${s.lat},${s.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Map
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </QueryState>
  );
}

export default function PortalTransportPage() {
  return (
    <PortalShell title="School Bus" description="Route, stops and live bus location">
      {({ studentId, isStudent }) =>
        isStudent ? (
          <EmptyBlock
            icon={Bus}
            text="Bus route and live tracking are shown on your parent's login."
          />
        ) : (
          <TransportView studentId={studentId} />
        )
      }
    </PortalShell>
  );
}
