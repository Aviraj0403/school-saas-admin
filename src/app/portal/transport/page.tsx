'use client';

import React from 'react';
import { Bus, MapPin, Navigation, Phone } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import { EmptyBlock, QueryState } from '@/components/portal/QueryState';
import { Badge } from '@/components/ui/badge';
import { useStudentTransport, useVehicleLocation } from '@/hooks/queries/useFamily';

const mapBtn =
  'inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-brand no-underline transition active:scale-[0.97]';

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
      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
        <section className="surface-card flex min-w-0 flex-col gap-4 p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="tone-chip tone-amber flex size-12 shrink-0 items-center justify-center rounded-2xl">
              <Bus className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-eyebrow">Route</p>
              <h3 className="text-card-title break-words">{route?.name}</h3>
              <p className="text-caption tabular">
                {[
                  route?.morningStart && `Morning ${route.morningStart}`,
                  route?.eveningStart && `Evening ${route.eveningStart}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>
          {vehicle && (
            <div className="space-y-2 text-sm">
              <p className="font-semibold">
                {vehicle.vehicleNo}{' '}
                <span className="font-normal capitalize text-muted-foreground">
                  ({vehicle.type})
                </span>
              </p>
              {vehicle.driverName && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/60 p-3">
                  <span className="text-muted-foreground">Driver: {vehicle.driverName}</span>
                  {vehicle.driverPhone && (
                    <a className={mapBtn} href={`tel:${vehicle.driverPhone}`}>
                      <Phone className="size-4" /> Call
                    </a>
                  )}
                </div>
              )}
              {vehicle.attendantName && (
                <p className="text-caption">
                  Attendant: {vehicle.attendantName} {vehicle.attendantPhone ?? ''}
                </p>
              )}
            </div>
          )}

          <div className="rounded-2xl bg-muted/60 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Navigation className="size-4" /> Live location
            </p>
            {loc.isPending && vehicle ? (
              <div className="h-10 animate-pulse rounded-xl bg-muted" />
            ) : loc.isError ? (
              <p className="text-caption">Live location is unavailable right now.</p>
            ) : loc.data ? (
              <div className="space-y-3 text-sm">
                <p className="text-caption tabular">
                  Last updated {new Date(loc.data.recordedAt).toLocaleTimeString('en-IN')}
                  {loc.data.speed != null && ` · ${Math.round(loc.data.speed)} km/h`}
                </p>
                <a
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-[15px] font-semibold text-white no-underline shadow-glow active:scale-[0.98]"
                  href={`https://www.google.com/maps?q=${loc.data.lat},${loc.data.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="size-4" /> Open in Maps
                </a>
              </div>
            ) : (
              <p className="text-caption">The bus has not shared its location yet.</p>
            )}
          </div>
        </section>

        <section className="surface-card min-w-0 p-4 sm:p-6 xl:col-span-2">
          <h3 className="text-card-title mb-3">Stops</h3>
          {stops.length === 0 ? (
            <p className="text-caption">No stops have been added to this route.</p>
          ) : (
            <ol className="space-y-2">
              {stops.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="flex min-w-0 flex-wrap items-center gap-3">
                    <span className="tone-chip tone-brand tabular flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                      {s.sequence}
                    </span>
                    <span className="font-medium">{s.name}</span>
                    {pickupId && pickupId === s.id && <Badge variant="success">Pickup stop</Badge>}
                  </span>
                  <span className="tabular flex flex-wrap items-center gap-3 pl-11 text-xs text-muted-foreground sm:pl-0">
                    {s.morningTime && <span>AM {s.morningTime}</span>}
                    {s.eveningTime && <span>PM {s.eveningTime}</span>}
                    {s.lat != null && s.lng != null && (
                      <a
                        className="inline-flex h-9 items-center gap-1 rounded-lg px-2 font-semibold text-brand"
                        href={`https://www.google.com/maps?q=${s.lat},${s.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin className="size-3.5" /> Map
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
