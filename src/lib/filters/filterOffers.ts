import type {
  CategorySlug,
  FilterState,
  Offer,
  PricingModel,
  RequirementState,
  ResourceType,
  SortOption,
  StudentAccessState,
  VerificationStatus,
} from '../../types/resource.ts';
import { searchOffers } from '../search/searchOffers.ts';
import { getAiContextWindow } from '../ai/aiModelMetadata.ts';

export const DEFAULT_FILTER_STATE: FilterState = {
  query: '',
  category: 'all',
  subcategory: 'all',
  pricingModels: [],
  cardRequired: 'all',
  studentAccess: 'all',
  resourceType: 'all',
  region: 'all',
  verificationStatus: 'all',
  sortBy: 'relevance',
};

export function filterAndSortOffers(offers: Offer[], filters: FilterState): Offer[] {
  const scored = searchOffers(offers, filters.query);

  const filtered = scored.filter(({ offer }) => {
    if (filters.category !== 'all' && offer.classification.category !== filters.category) {
      return false;
    }

    if (
      filters.subcategory !== 'all' &&
      offer.classification.subcategory.toLowerCase() !== filters.subcategory.toLowerCase()
    ) {
      return false;
    }

    if (
      filters.pricingModels.length > 0 &&
      !filters.pricingModels.includes(offer.classification.pricing_model)
    ) {
      return false;
    }

    // Strict tri-state matching: unknown NEVER matches not_required or required
    if (
      filters.cardRequired !== 'all' &&
      offer.access.requirements.card_required !== filters.cardRequired
    ) {
      return false;
    }

    if (
      filters.studentAccess !== 'all' &&
      offer.eligibility.student_access !== filters.studentAccess
    ) {
      return false;
    }

    if (
      filters.resourceType !== 'all' &&
      offer.classification.resource_type !== filters.resourceType
    ) {
      return false;
    }

    if (filters.region !== 'all') {
      const regionMatch = offer.eligibility.regions.some((r) =>
        r.toLowerCase().includes(filters.region.toLowerCase())
      );
      if (!regionMatch) return false;
    }

    if (
      filters.verificationStatus !== 'all' &&
      offer.verification.status !== filters.verificationStatus
    ) {
      return false;
    }

    return true;
  });

  if (filters.sortBy === 'relevance' && filters.query.trim().length > 0) {
    return filtered.map((entry) => entry.offer);
  }

  const list = filtered.map((entry) => entry.offer);

  if (filters.sortBy === 'context_desc') {
    return [...list].sort((a, b) => {
      const ctxA = getAiContextWindow(a)?.tokens ?? 0;
      const ctxB = getAiContextWindow(b)?.tokens ?? 0;
      if (ctxB !== ctxA) return ctxB - ctxA;
      const fa = a.metadata.featured ? 1 : 0;
      const fb = b.metadata.featured ? 1 : 0;
      if (fb !== fa) return fb - fa;
      return a.identity.name.localeCompare(b.identity.name);
    });
  }

  if (filters.sortBy === 'recently_verified') {
    return [...list].sort((a, b) => {
      const da = a.verification.last_verified_at ?? '';
      const db = b.verification.last_verified_at ?? '';
      return db.localeCompare(da) || a.identity.name.localeCompare(b.identity.name);
    });
  }

  if (filters.sortBy === 'recently_added') {
    return [...list].sort((a, b) => {
      const da = a.metadata.created_at ?? '';
      const db = b.metadata.created_at ?? '';
      return db.localeCompare(da) || a.identity.name.localeCompare(b.identity.name);
    });
  }

  if (filters.sortBy === 'use_case') {
    const subCounts = new Map<string, number>();
    for (const item of list) {
      const s = item.classification.subcategory;
      subCounts.set(s, (subCounts.get(s) ?? 0) + 1);
    }
    return [...list].sort((a, b) => {
      const countA = subCounts.get(a.classification.subcategory) ?? 0;
      const countB = subCounts.get(b.classification.subcategory) ?? 0;
      if (countB !== countA) return countB - countA;
      const subCmp = a.classification.subcategory.localeCompare(b.classification.subcategory);
      if (subCmp !== 0) return subCmp;
      const fa = a.metadata.featured ? 1 : 0;
      const fb = b.metadata.featured ? 1 : 0;
      if (fb !== fa) return fb - fa;
      const ctxA = getAiContextWindow(a)?.tokens ?? 0;
      const ctxB = getAiContextWindow(b)?.tokens ?? 0;
      if (ctxB !== ctxA) return ctxB - ctxA;
      return a.identity.name.localeCompare(b.identity.name);
    });
  }

  if (filters.sortBy === 'name_asc') {
    return [...list].sort((a, b) => a.identity.name.localeCompare(b.identity.name));
  }

  // Default relevance when query is empty: pinned top defaults first, then featured, then recently verified
  const PINNED_DEFAULT_SLUGS: Record<string, number> = {
    // AI Models pinned top default
    'nvidia-nim-free-api-catalog': 1,
    // Frontend & Design Tools pinned defaults
    'gradientdeck-ui-design-md': 1,
    'getdesign-md-website-library': 2,
    'kombai-ai-design-engineer': 3,
    // Databases & Backend ordered strictly from Most Popular (#1) to Least Popular (#125)
    'supabase-free-plan': 1,
    'render-free-postgres-redis-backend': 2,
    'railway-backend-databases-trial': 3,
    'aws-free-tier-databases-backend': 4,
    'mongodb-atlas-free-forever-m0': 5,
    'firebase-spark-firestore-baas': 6,
    'neon-serverless-postgres': 7,
    'postgresql-open-source-rdbms': 8,
    'redis-cloud-free-open-source': 9,
    'sqlite-embedded-sql-engine': 10,
    'mysql-community-server': 11,
    'cloudflare-r2-zero-egress-storage': 12,
    'cloudflare-d1-serverless-sql': 13,
    'cloudflare-workers-kv-durable-objects': 14,
    'upstash-serverless-redis-kafka': 15,
    'prisma-orm-studio-accelerate': 16,
    'drizzle-orm-drizzle-kit-studio': 17,
    'clerk-free-authentication-user-mgmt': 18,
    'auth0-free-identity-platform': 19,
    'turso-starter-libsql': 20,
    'appwrite-cloud-open-source-baas': 21,
    'convex-reactive-backend-database': 22,
    'pocketbase-single-file-go-backend': 23,
    'mariadb-server-open-source': 24,
    'cockroachdb-cloud-free-serverless': 25,
    'clickhouse-olap-columnar-db': 26,
    'duckdb-in-process-olap-sql': 27,
    'pinecone-starter-vector-db': 28,
    'qdrant-cloud-open-source-vector-db': 29,
    'weaviate-vector-database': 30,
    'chroma-open-source-embedding-db': 31,
    'pgvector-postgres-vector-search': 32,
    'milvus-zilliz-cloud-vector-db': 33,
    'lancedb-serverless-multimodal-vector-db': 34,
    'opensearch-open-source-search-analytics': 35,
    'meilisearch-lightning-fast-search': 36,
    'typesense-open-source-search': 37,
    'algolia-build-free-search': 38,
    'neo4j-aura-free-graph-database': 39,
    'keycloak-open-source-iam-sso': 40,
    'auth-js-nextauth-open-source': 41,
    'better-auth-typescript-framework': 42,
    'workos-authkit-free-1m-users': 43,
    'zitadel-open-source-identity-management': 44,
    'apache-kafka-redpanda-streaming': 45,
    'rabbitmq-nats-message-brokers': 46,
    'temporal-io-durable-execution': 47,
    'inngest-durable-serverless-workflows': 48,
    'trigger-dev-background-jobs': 49,
    'bullmq-redis-distributed-queues-jobs': 50,
    'strapi-open-source-headless-cms': 51,
    'sanity-io-free-content-lake': 52,
    'payload-cms-nextjs-native-backend': 53,
    'directus-sql-data-platform': 54,
    'hasura-graphql-engine-ddn': 55,
    'hono-fastify-nestjs-backend-frameworks': 56,
    'minio-open-source-s3-object-storage': 57,
    'cloudinary-free-media-backend': 58,
    'backblaze-b2-cloud-storage-free': 59,
    'uploadthing-file-uploads-nextjs': 60,
    'imagekit-io-free-media-storage': 61,
    'seaweedfs-distributed-object-file-storage': 62,
    'dbeaver-community-database-gui': 63,
    'pgadmin-4-postgresql-management': 64,
    'beekeeper-studio-community': 65,
    'sqlalchemy-alembic-python-orm': 66,
    'sequelize-nodejs-typescript-sql-orm': 67,
    'typeorm-typescript-orm': 68,
    'mikro-orm-typescript-data-mapper-orm': 69,
    'kysely-type-safe-sql-query-builder': 70,
    'flyway-liquibase-db-migrations': 71,
    'bytebase-database-ci-cd-schema': 72,
    'atlas-declarative-database-schemas': 73,
    'chartdb-dbdiagram-erd-visualizer': 74,
    'timescaledb-time-series-postgres': 75,
    'influxdb-time-series-database': 76,
    'victoria-metrics-time-series-database': 77,
    'questdb-high-throughput-timeseries': 78,
    'apache-druid-realtime-analytics-db': 79,
    'apache-pinot-realtime-distributed-olap': 80,
    'apache-doris-starrocks-olap': 81,
    'tinybird-real-time-clickhouse-apis': 82,
    'crate-db-distributed-sql-timeseries': 83,
    'valkey-open-source-in-memory-store': 84,
    'dragonfly-modern-in-memory-datastore': 85,
    'scylladb-open-source-nosql-database': 86,
    'apache-cassandra-datastax-astra': 87,
    'couchbase-capella-free-tier': 88,
    'apache-couchdb-pouchdb-sync': 89,
    'rocksdb-meta-embedded-key-value-store': 90,
    'garnet-microsoft-remote-cache-store': 91,
    'apache-ignite-distributed-in-memory-db': 92,
    'keydb-multithreaded-redis': 93,
    'surrealdb-multi-model-database': 94,
    'ferretdb-open-source-mongodb-postgres': 95,
    'tidb-cloud-serverless-free': 96,
    'aiven-free-postgresql-mysql': 97,
    'vitess-horizontal-mysql-clustering': 98,
    'citus-distributed-postgresql-extension': 99,
    'edgedb-gel-graph-relational-db': 100,
    'dolt-dolthub-version-controlled-sql': 101,
    'pglite-wasm-postgres-in-browser': 102,
    'xata-serverless-postgres-search': 103,
    'tembo-cloud-postgres-extensions': 104,
    'filess-io-free-sql-databases': 105,
    'nhost-graphql-postgres-baas': 106,
    'back4app-parse-backend-free': 107,
    'parse-platform-open-source-baas': 108,
    'instantdb-client-side-reactive-db': 109,
    'electric-sql-postgres-local-first-sync': 110,
    'zero-rocicorp-instant-web-sync': 111,
    'powersync-offline-first-postgres-sync': 112,
    'spacetimedb-multiplayer-relational-db': 113,
    'encore-ts-go-backend-framework': 114,
    'ably-pusher-realtime-pub-sub': 115,
    'kinde-free-auth-feature-flags': 116,
    'supertokens-open-source-auth': 117,
    'ory-kratos-hydra-keto-iam': 118,
    'logto-open-source-ciam-auth': 119,
    'casdoor-open-source-ui-first-iam-sso': 120,
    'vespa-ai-big-data-vector-search-engine': 121,
    'dgraph-distributed-graph-database': 122,
    'memgraph-real-time-graph-db': 123,
    'falkordb-low-latency-graph-database': 124,
    'manifest-1-file-yaml-backend': 125,
    // Security & Networking ordered strictly from Most Popular (#1) to Least Popular (#125)
    'cloudflare-zero-trust-free': 1,
    'tailscale-free-wireguard-mesh-vpn': 2,
    'wireshark-network-protocol-analyzer': 3,
    'nmap-network-mapper-scanner': 4,
    'owasp-zap-zed-attack-proxy': 5,
    'lets-encrypt': 6,
    'burp-suite-community-edition': 7,
    'bitwarden-open-source-password-manager': 8,
    'cloudflare-1-1-1-1-dns-waf-ddos': 9,
    'wireguard-fast-modern-secure-vpn': 10,
    'nginx-open-source-reverse-proxy-lb': 11,
    'caddy-automatic-https-web-server-proxy': 12,
    'traefik-proxy-cloud-native-edge-router': 13,
    'haproxy-high-availability-load-balancer': 14,
    'envoy-proxy-cloud-native-service-proxy': 15,
    'certbot-eff-acme-tls-client': 16,
    'hashicorp-vault-openbao-secrets': 17,
    'trivy-aqua-container-vulnerability-scanner': 18,
    'snyk-free-developer-security-platform': 19,
    'semgrep-community-static-analysis-sast': 20,
    'sonarqube-community-build-code-security': 21,
    'metasploit-framework-open-source': 22,
    'ghidra-nsa-software-reverse-engineering': 23,
    'virustotal-free-malware-url-analyzer': 24,
    'shodan-internet-device-search-engine': 25,
    'portswigger-web-security-academy': 26,
    'tryhackme-free-cybersecurity-rooms': 27,
    'hack-the-box-starting-point-academy': 28,
    'nuclei-projectdiscovery-vulnerability-scanner': 29,
    'sqlmap-automatic-sql-injection-tool': 30,
    'hashcat-advanced-password-recovery': 31,
    'john-the-ripper-password-cracker': 32,
    'aircrack-ng-wifi-security-auditing': 33,
    'frida-dynamic-instrumentation-toolkit': 34,
    'mitmproxy-interactive-tls-intercepting-proxy': 35,
    'pi-hole-network-wide-dns-sinkhole': 36,
    'adguard-home-network-dns-blocker': 37,
    'nextdns-free-encrypted-dns-firewall': 38,
    'quad9-anycast-threat-blocking-dns': 39,
    'pfsense-community-edition-firewall': 40,
    'opnsense-open-source-firewall-routing': 41,
    'fail2ban-intrusion-prevention-log-ban': 42,
    'crowdsec-collaborative-ips-waf-engine': 43,
    'wazuh-open-source-xdr-siem': 44,
    'suricata-network-ids-ips-nsm': 45,
    'zeek-network-security-monitor': 46,
    'snort-network-intrusion-detection': 47,
    'osquery-sql-powered-endpoint-visibility': 48,
    'falco-cncf-cloud-native-runtime-security': 49,
    'keepassxc-cross-platform-password-manager': 50,
    'vaultwarden-lightweight-rust-bitwarden-server': 51,
    'authentik-open-source-identity-provider': 52,
    'authelia-open-source-2fa-sso-portal': 53,
    'infisical-open-source-secrets-management': 54,
    'doppler-free-developer-secrets-manager': 55,
    'openvpn-community-edition-vpn-server': 56,
    'zerotier-free-global-sd-wan-mesh': 57,
    'netbird-open-source-zero-trust-mesh': 58,
    'cloudflared-argo-tunnel-daemon': 59,
    'frp-fast-reverse-proxy-nat-traversal': 60,
    'headscale-self-hosted-tailscale-control': 61,
    'twingate-starter-zero-trust-network-access': 62,
    'nebula-scalable-overlay-mesh-network': 63,
    'pomerium-identity-aware-zero-trust-proxy': 64,
    'pangolin-self-hosted-tunneled-reverse-proxy': 65,
    'zrok-openziti-zero-trust-sharing': 66,
    'chisel-fast-tcp-udp-tunnel-over-http': 67,
    'rathole-rust-nat-traversal-reverse-proxy': 68,
    'tcpdump-libpcap-packet-analyzer': 69,
    'netcat-ncat-socat-network-swiss-army': 70,
    'iperf3-network-bandwidth-measurement': 71,
    'mtr-my-traceroute-network-diagnostic': 72,
    'istio-linkerd-cilium-service-mesh': 73,
    'coredns-cloud-native-dns-server': 74,
    'unbound-validating-recursive-dns': 75,
    'squid-optimising-web-caching-proxy': 76,
    'modsecurity-coraza-owasp-crs-waf': 77,
    'bunkerweb-open-source-next-gen-waf': 78,
    'mkcert-zero-config-local-https-certs': 79,
    'mozilla-sops-age-encrypted-secrets': 80,
    'smallstep-step-ca-step-cli-private-pki': 81,
    'passbolt-open-source-team-password-manager': 82,
    'gitleaks-trufflehog-secret-scanner': 83,
    'checkov-iac-static-security-scanner': 84,
    'prowler-open-source-cloud-security': 85,
    'osv-scanner-grype-vulnerability-scanner': 86,
    'sigstore-cosign-software-signing': 87,
    'kubescape-kubernetes-security-platform': 88,
    'clamav-yara-malware-detection': 89,
    'ffuf-fast-web-fuzzer-go': 90,
    'gobuster-directory-dns-vhost-busting': 91,
    'feroxbuster-recursive-content-discovery': 92,
    'nikto-open-source-web-server-scanner': 93,
    'caido-lightweight-web-security-toolkit': 94,
    'radare2-rizin-cutter-reverse-engineering': 95,
    'impacket-network-protocols-security-python': 96,
    'responder-netexec-active-directory-audit': 97,
    'bloodhound-community-edition-ad-graph': 98,
    'subfinder-httpx-naabu-projectdiscovery': 99,
    'masscan-mass-ip-port-scanner': 100,
    'rustscan-modern-fast-port-scanner': 101,
    'zmap-fast-single-packet-network-scanner': 102,
    'openvas-greenbone-community-vulnerability': 103,
    'lynis-cisofy-linux-security-auditing': 104,
    'qualys-ssl-labs-server-test': 105,
    'testssl-sh-tls-cipher-scanner': 106,
    'mozilla-observatory-http-security-scanner': 107,
    'owasp-amass-attack-surface-mapping': 108,
    'censys-search-internet-asset-discovery': 109,
    'abuseipdb-greynoise-threat-intel': 110,
    'security-onion-threat-hunting-nsm': 111,
    'velociraptor-digital-forensics-incident-response': 112,
    'misp-open-source-threat-intelligence': 113,
    'opencti-open-cyber-threat-intelligence': 114,
    'overthewire-wargames-bandit-natas': 115,
    'picoctf-cmu-capture-the-flag-gym': 116,
    'owasp-juice-shop-vulnerable-web-app': 117,
    'cryptohack-interactive-cryptography-labs': 118,
    'pwn-college-asu-binary-exploitation-dojo': 119,
    'sniffnet-cross-platform-network-monitor': 120,
    'termshark-terminal-wireshark-tui': 121,
    'gping-graphical-ping-cli': 122,
    'trippy-network-diagnostics-tui': 123,
    'bandwhich-terminal-bandwidth-utilization': 124,
    'doggo-modern-command-line-dns-client': 125,
    // Productivity & Collaboration ordered strictly from Most Popular (#1) to Least Popular (#125)
    'notion-free-plan': 1,
    'linear-free-issue-tracking': 2,
    'slack-free-team-messaging': 3,
    'obsidian-markdown-knowledge-base': 4,
    'excalidraw-whiteboard': 5,
    'n8n-workflow-automation-self-hosted': 6,
    'atlassian-jira-free-plan': 7,
    'miro-free-collaborative-whiteboard': 8,
    'discord-free-communities-voice-screen': 9,
    'trello-free-kanban-boards': 10,
    'asana-personal-free-project-management': 11,
    'clickup-free-forever-workspace': 12,
    'atlassian-confluence-free-wiki': 13,
    'airtable-free-connected-apps-database': 14,
    'zapier-free-automation-platform': 15,
    'calendly-free-appointment-scheduling': 16,
    'loom-starter-free-async-video': 17,
    'obs-studio-open-source-recording-streaming': 18,
    'todoist-beginner-free-task-manager': 19,
    'raycast-free-mac-windows-launcher': 20,
    'mermaid-js-markdown-diagrams-code': 21,
    'draw-io-diagrams-net-flowchart-maker': 22,
    'tldraw-infinite-canvas-whiteboard': 23,
    'make-com-free-visual-automation': 24,
    'cal-com-open-source-scheduling-platform': 25,
    'nextcloud-open-source-collaboration-suite': 26,
    'libreoffice-onlyoffice-open-source-suite': 27,
    'thunderbird-open-source-email-calendar-pim': 28,
    'rustdesk-open-source-remote-desktop-collab': 29,
    'syncthing-continuous-p2p-file-sync': 30,
    'jitsi-meet-open-source-video-conferencing': 31,
    'mattermost-open-source-team-collaboration': 32,
    'element-matrix-decentralized-secure-chat': 33,
    'zulip-open-source-threaded-team-chat': 34,
    'rocket-chat-open-source-communications': 35,
    'discourse-open-source-community-forum': 36,
    'docusaurus-meta-documentation-generator': 37,
    'mkdocs-material-technical-documentation': 38,
    'vitepress-vue-static-site-docs': 39,
    'mintlify-free-developer-documentation': 40,
    'astro-starlight-documentation-framework': 41,
    'logseq-open-source-knowledge-graph': 42,
    'joplin-open-source-encrypted-notes': 43,
    'affine-open-source-notion-miro-workspace': 44,
    'appflowy-open-source-ai-workspace': 45,
    'anytype-local-first-p2p-workspace': 46,
    'siyuan-local-first-markdown-block-notes': 47,
    'coda-free-collaborative-docs': 48,
    'standard-notes-end-to-end-encrypted': 49,
    'capacities-studio-object-based-notetaking': 50,
    'memos-open-source-self-hosted-notes': 51,
    'outline-open-source-team-wiki': 52,
    'bookstack-self-hosted-wiki-platform': 53,
    'wiki-js-open-source-wiki-engine': 54,
    'docmost-open-source-collaborative-wiki': 55,
    'trilium-notes-hierarchical-knowledge-base': 56,
    'silverbullet-markdown-personal-wiki': 57,
    'hedgedoc-collaborative-realtime-markdown': 58,
    'etherpad-open-source-realtime-collaborative-editor': 59,
    'plane-open-source-jira-linear-alternative': 60,
    'youtrack-jetbrains-free-10-users': 61,
    'shortcut-free-software-project-management': 62,
    'twenty-open-source-crm-workspace': 63,
    'huly-open-source-all-in-one-platform': 64,
    'openproject-open-source-project-management': 65,
    'taiga-open-source-agile-scrum-kanban': 66,
    'ticktick-free-tasks-pomodoro-habit-tracker': 67,
    'focalboard-open-source-project-boards': 68,
    'vikunja-open-source-todo-kanban': 69,
    'planka-open-source-realtime-kanban': 70,
    'wekan-open-source-kanban-board': 71,
    'leantime-open-source-project-management': 72,
    'nocodb-open-source-airtable-alternative': 73,
    'baserow-open-source-no-code-database': 74,
    'grist-open-source-relational-spreadsheet': 75,
    'teable-nextjs-postgres-airtable-alternative': 76,
    'budibase-open-source-internal-tools-forms': 77,
    'tally-free-unlimited-form-builder': 78,
    'typebot-open-source-conversational-forms': 79,
    'formbricks-open-source-surveys-forms': 80,
    'opnform-open-source-notion-style-forms': 81,
    'heyform-open-source-online-form-builder': 82,
    'mathesar-open-source-postgres-ui': 83,
    'ifttt-free-applet-automation': 84,
    'node-red-low-code-event-driven-programming': 85,
    'activepieces-open-source-zapier-alternative': 86,
    'pipedream-free-developer-workflow-automation': 87,
    'windmill-open-source-developer-workflows': 88,
    'kestra-open-source-event-driven-orchestrator': 89,
    'huginn-self-hosted-autonomous-agents': 90,
    'dagu-open-source-dag-workflow-runner': 91,
    'automatisch-open-source-workflow-automation': 92,
    'clockify-free-unlimited-time-tracker': 93,
    'toggl-track-free-time-tracking': 94,
    'wakatime-free-developer-coding-metrics': 95,
    'activitywatch-open-source-automated-time': 96,
    'kimai-open-source-time-tracking': 97,
    'rallly-open-source-group-meeting-polls': 98,
    'plantuml-open-source-uml-diagrams': 99,
    'graphviz-open-source-graph-visualization': 100,
    'whimsical-starter-flowcharts-wireframes': 101,
    'eraser-io-free-diagram-as-code': 102,
    'd2-declarative-diagram-scripting-language': 103,
    'kroki-unified-text-to-diagram-api': 104,
    'markmap-markdown-interactive-mindmaps': 105,
    'freeplane-open-source-mind-mapping': 106,
    'structurizr-lite-c4-architecture-diagrams': 107,
    'typst-modern-scientific-typesetting-latex': 108,
    'reveal-js-html-presentation-framework': 109,
    'slidev-markdown-presentations-developers': 110,
    'marp-markdown-presentation-ecosystem': 111,
    'flameshot-open-source-screenshot-annotation': 112,
    'screenity-open-source-annotated-recorder': 113,
    'cap-so-open-source-loom-alternative': 114,
    'pairdrop-localsend-lan-file-sharing': 115,
    'owncloud-infinite-scale-file-sync': 116,
    'chatwoot-open-source-customer-team-inbox': 117,
    'livekit-open-source-realtime-voice-video': 118,
    'flarum-lightweight-open-source-forum': 119,
    'mumble-low-latency-open-source-voice': 120,
    'revolt-stoat-open-source-chat': 121,
    'docuseal-open-source-document-filling-signing': 122,
    'documenso-open-source-docusign-alternative': 123,
    'flow-launcher-open-source-windows-launcher': 124,
    'espanso-cross-platform-text-expander': 125,
    // Cloud & Hosting pinned defaults (most popular at top)
    'cloudflare-pages-workers': 1,
    'vercel-hobby': 2,
    'aws-free-tier-cloud-credits': 3,
    'google-cloud-free-program-300': 4,
    'oracle-cloud-always-free': 5,
    'microsoft-azure-free-account-200': 6,
    'netlify-starter-free-hosting': 7,
    'render-free-web-services-static': 8,
    'fly-io-machines-app-hosting': 9,
    'github-pages-static': 10,
    // Student Benefits pinned defaults (most popular at top)
    'github-student-developer-pack': 1,
    'jetbrains-educational-pack': 2,
    'azure-for-students': 3,
    'github-copilot-pro-students': 4,
    'cursor-pro-student-free': 5,
    'figma-education': 6,
    'notion-plus-education': 7,
    'google-one-ai-premium-students': 8,
    'autodesk-education-free-plan': 9,
    'aws-educate-cloud-skills': 10,
    'namecheap-nc-me-student-domain': 11,
    'canva-education-free': 12,
    // Learning & Study Materials ordered strictly from Most Popular (#1) to Least Popular (#109)
    'freecodecamp-curriculum': 1,
    'mdn-web-docs': 2,
    'harvard-cs50x': 3,
    'roadmap-sh': 4,
    'the-odin-project': 5,
    'leetcode-free-algorithm-practice': 6,
    'mit-ocw-math-cs': 7,
    'khan-academy-computing-math': 8,
    'w3schools-web-tutorials': 9,
    'full-stack-open-helsinki': 10,
    'neetcode-dsa-practice': 11,
    'deeplearning-ai-short-courses': 12,
    'kaggle-learn-micro-courses': 13,
    'javascript-info-modern-tutorial': 14,
    'system-design-primer-donne-martin': 15,
    '3blue1brown-essence-math-ml': 16,
    'huggingface-learn-ai-courses': 17,
    'fast-ai-practical-deep-learning': 18,
    'react-dev-official-learn': 19,
    'eloquent-javascript-book': 20,
    'python-for-everybody-py4e': 21,
    'harvard-cs50p-python-programming': 22,
    'exercism-mentored-coding-tracks': 23,
    'hackerrank-coding-interview-practice': 24,
    'codeforces-competitive-programming': 25,
    'refactoring-guru-design-patterns': 26,
    'rust-book-official-doc': 27,
    'google-machine-learning-crash-course': 28,
    'web-dev-google-chrome-learn': 29,
    'aws-skill-builder-free-courses': 30,
    'missing-semester-mit-cs': 31,
    'oss-university-computer-science': 32,
    'stanford-cs229-machine-learning': 33,
    'stanford-cs231n-deep-learning-vision': 34,
    'karpathy-neural-networks-zero-to-hero': 35,
    'scrimba-free-interactive-coding': 36,
    'codewars-coding-kata-dojo': 37,
    'devdocs-io-offline-api-docs': 38,
    'python-official-tutorial-docs': 39,
    'go-tour-interactive-golang': 40,
    'typescript-handbook-official': 41,
    'automate-the-boring-stuff-python': 42,
    'you-dont-know-js-yet-book': 43,
    'pro-git-book-scott-chacon': 44,
    'google-sre-books-free': 45,
    'overthewire-wargames-linux-security': 46,
    'advent-of-code-puzzles': 47,
    'project-euler-math-programming': 48,
    'visualgo-algorithm-visualizer': 49,
    'pythontutor-code-execution-visualizer': 50,
    'teachyourselfcs-curriculum-guide': 51,
    'tech-interview-handbook-yangshun': 52,
    'frontend-interview-handbook': 53,
    'striver-a2z-dsa-course-sheet': 54,
    'frontend-mentor-free-challenges': 55,
    'nextjs-learn-official-courses': 56,
    'harvard-cs50ai-artificial-intelligence': 57,
    'harvard-cs50w-web-programming': 58,
    'harvard-cs50sql-databases': 59,
    'sqlbolt-interactive-sql-lessons': 60,
    'sqlzoo-interactive-sql-tutorials': 61,
    'regexone-interactive-regex-tutorial': 62,
    'learngitbranching-visual-git': 63,
    'flexbox-froggy-css-grid-garden': 64,
    'kubernetes-io-interactive-tutorials': 65,
    'docker-curriculum-hands-on': 66,
    'linux-journey-interactive-linux': 67,
    'sadservers-linux-troubleshooting-labs': 68,
    'cryptohack-modern-cryptography-puzzles': 69,
    'pwn-college-asu-cybersecurity': 70,
    'mit-6-824-distributed-systems': 71,
    'cmu-15-445-database-systems': 72,
    'uc-berkeley-cs61a-structure-interpretation': 73,
    'princeton-algorithms-sedgewick': 74,
    'stanford-cs144-computer-networking': 75,
    'nand2tetris-elements-computing-systems': 76,
    'ostep-operating-systems-three-easy-pieces': 77,
    'crafting-interpreters-bob-ystrom': 78,
    'high-performance-browser-networking-grigorik': 79,
    'dive-into-deep-learning-d2l': 80,
    'mathematics-for-machine-learning-book': 81,
    'statquest-josh-starmer-ml-guides': 82,
    'made-with-ml-production-mlops': 83,
    'spinning-up-deep-rl-openai': 84,
    'llm-course-maxim-labonne': 85,
    'prompt-engineering-guide-dair-ai': 86,
    'google-tech-dev-guide': 87,
    'mooc-fi-java-python-programming': 88,
    'django-for-everybody-dj4e': 89,
    'real-python-free-tutorials': 90,
    'fullstack-python-open-guide': 91,
    'rust-by-example-interactive': 92,
    'comprehensive-rust-google-android': 93,
    'gobyexample-annotated-go': 94,
    'learncpp-complete-cpp-tutorials': 95,
    'cppreference-c-cpp-wiki': 96,
    'learn-x-in-y-minutes-cheatsheets': 97,
    'devhints-tl-dr-cheatsheets': 98,
    'overapi-developer-cheatsheets': 99,
    'the-art-of-command-line-guide': 100,
    'linux-command-line-shotts-book': 101,
    'beejs-guide-network-programming': 102,
    'patterns-dev-modern-web-patterns': 103,
    'clean-code-javascript-ryan-mcdermott': 104,
    'twelve-factor-app-methodology': 105,
    'martinfowler-software-architecture': 106,
    'bytebytego-system-design-newsletters': 107,
    'aosabook-architecture-open-source': 108,
    'cp-algorithms-competitive-programming': 109,
    'usaco-guide-competitive-programming': 110,
    'cses-problem-set-algorithms': 111,
    'atcoder-competitive-contests': 112,
    'desmos-graphing-math-studio': 113,
    'geogebra-interactive-math-calculus': 114,
    'nature-of-code-shiffman': 115,
    'the-book-of-shaders-glsl': 116,
    'redblobgames-interactive-algorithms': 117,
    'cssbattle-css-code-golf': 118,
    'seeing-theory-brown-probability': 119,
  };

  return [...list].sort((a, b) => {
    const pinA = PINNED_DEFAULT_SLUGS[a.identity.slug] ?? 999;
    const pinB = PINNED_DEFAULT_SLUGS[b.identity.slug] ?? 999;
    if (pinA !== pinB) return pinA - pinB;

    const fa = a.metadata.featured ? 1 : 0;
    const fb = b.metadata.featured ? 1 : 0;
    if (fb !== fa) return fb - fa;
    const da = a.verification.last_verified_at ?? '';
    const db = b.verification.last_verified_at ?? '';
    return db.localeCompare(da) || a.identity.name.localeCompare(b.identity.name);
  });
}

export function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.query.trim()) count += 1;
  if (filters.category !== 'all') count += 1;
  if (filters.subcategory !== 'all') count += 1;
  if (filters.pricingModels.length > 0) count += filters.pricingModels.length;
  if (filters.cardRequired !== 'all') count += 1;
  if (filters.studentAccess !== 'all') count += 1;
  if (filters.resourceType !== 'all') count += 1;
  if (filters.region !== 'all') count += 1;
  if (filters.verificationStatus !== 'all') count += 1;
  return count;
}

export function filtersToSearchParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set('q', filters.query.trim());
  if (filters.category !== 'all') params.set('category', filters.category);
  if (filters.subcategory !== 'all') params.set('subcategory', filters.subcategory);
  if (filters.pricingModels.length > 0) {
    params.set('pricing', filters.pricingModels.join(','));
  }
  if (filters.cardRequired !== 'all') params.set('card', filters.cardRequired);
  if (filters.studentAccess !== 'all') params.set('student', filters.studentAccess);
  if (filters.resourceType !== 'all') params.set('type', filters.resourceType);
  if (filters.region !== 'all') params.set('region', filters.region);
  if (filters.verificationStatus !== 'all') params.set('status', filters.verificationStatus);
  if (filters.sortBy !== 'relevance') params.set('sort', filters.sortBy);
  return params;
}

export function searchParamsToFilters(params: URLSearchParams): FilterState {
  const query = params.get('q') ?? '';
  const category = (params.get('category') as CategorySlug | 'all') || 'all';
  const subcategory = params.get('subcategory') || 'all';

  const pricingRaw = params.get('pricing') ?? '';
  const pricingModels = pricingRaw
    ? (pricingRaw.split(',').filter(Boolean) as PricingModel[])
    : [];

  // Normalize legacy ?card=no_card | card_required aliases gracefully
  const cardParam = params.get('card') ?? 'all';
  let cardRequired: RequirementState | 'all' = 'all';
  if (cardParam === 'no_card' || cardParam === 'not_required') cardRequired = 'not_required';
  else if (cardParam === 'card_required' || cardParam === 'required') cardRequired = 'required';
  else if (cardParam === 'unknown') cardRequired = 'unknown';

  const studentParam = params.get('student') ?? 'all';
  let studentAccess: StudentAccessState | 'all' = 'all';
  if (studentParam === 'student_only' || studentParam === 'exclusive') studentAccess = 'exclusive';
  else if (studentParam === 'eligible' || studentParam === 'not_eligible' || studentParam === 'unknown') {
    studentAccess = studentParam;
  }

  const resourceType = (params.get('type') as ResourceType | 'all') || 'all';
  const region = params.get('region') || 'all';
  const verificationStatus =
    (params.get('status') as VerificationStatus | 'all') || 'all';

  const sortParam = params.get('sort') || 'relevance';
  const sortBy: SortOption =
    sortParam === 'recent' ? 'recently_verified' : (sortParam as SortOption);

  return {
    query,
    category,
    subcategory,
    pricingModels,
    cardRequired,
    studentAccess,
    resourceType,
    region,
    verificationStatus,
    sortBy,
  };
}
