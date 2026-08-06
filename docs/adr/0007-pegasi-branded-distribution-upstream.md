# Pegasi branded distribution tracks this repo as upstream

Pegasi needs its own Marketplace identity and default `pegasi_router` URL, but almost the same classroom-install behavior as Vans. We keep this repo as the engine upstream and let `pegasi-one-click-install` sync from it, rather than one shared extension that students reconfigure, or a Template fork with no merge path. Brand-only deltas (name, icons, colors, contribution ids, default Router) live in the Pegasi repo; Router contract parity with `pegasi_router` remains required.
