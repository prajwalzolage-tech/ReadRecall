// src/lib/curated-articles.ts
// Curated technical articles available out-of-the-box with human-verified key points

import type { Article } from '@/types';
import { countWords } from '@/hooks/use-word-count';
import { splitSections } from '@/lib/section-splitter';

const RAW_ARTICLES: Omit<Article, 'sections'>[] = [
  {
    id: 'curated-1',
    title: 'How Blockchain Consensus Mechanisms Work',
    source: 'curated',
    keyPointSource: 'human',
    status: 'ready',
    authors: ['Distributed Systems Lab'],
    year: 2022,
    contentHash: 'hash-consensus-mechanisms-2022',
    wordCount: 167,
    mainIdea: 'Blockchain networks use various consensus mechanisms like PoW and PoS to achieve agreement on ledger state, each with different trade-offs.',
    text: `Blockchain networks rely on consensus mechanisms to agree on the state of the distributed ledger without a central authority. The most well-known mechanism is Proof of Work (PoW), used by Bitcoin, where miners compete to solve complex mathematical puzzles. The first miner to find a valid solution gets to add the next block and receives a reward. While PoW is highly secure, it consumes enormous amounts of energy.

Proof of Stake (PoS) emerged as an energy-efficient alternative. Instead of mining, validators lock up cryptocurrency as collateral. The network selects validators to propose blocks based on the amount they have staked. If a validator acts dishonestly, their stake is "slashed" — partially or fully confiscated. Ethereum transitioned from PoW to PoS in 2022, reducing its energy consumption by over 99%.

Other mechanisms include Delegated Proof of Stake (DPoS), where token holders vote for delegates, and Practical Byzantine Fault Tolerance (PBFT), common in permissioned blockchains. Each mechanism represents a different trade-off between decentralization, security, throughput, and energy efficiency. The choice of consensus protocol fundamentally shapes a blockchain's capabilities and limitations.`,
    keyPoints: [
      { text: 'Proof of Work requires miners to solve complex puzzles, providing security but consuming significant energy', verified: true },
      { text: 'Proof of Stake selects validators based on staked cryptocurrency, offering energy efficiency over PoW', verified: true },
      { text: 'Ethereum transitioned from PoW to PoS in 2022, reducing energy consumption by over 99%', verified: true },
      { text: 'Dishonest PoS validators face slashing, where their staked collateral is confiscated', verified: true },
      { text: 'Different consensus mechanisms trade off between decentralization, security, throughput, and energy efficiency', verified: true },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    createdBy: 'system-seed',
  },
  {
    id: 'curated-2',
    title: 'Smart Contracts: Self-Executing Agreements on the Blockchain',
    source: 'curated',
    keyPointSource: 'human',
    status: 'ready',
    authors: ['Nick Szabo'],
    year: 2021,
    contentHash: 'hash-smart-contracts-2021',
    wordCount: 184,
    mainIdea: 'Smart contracts are immutable blockchain programs that automatically execute agreements when conditions are met, eliminating intermediaries.',
    text: `Smart contracts are programs stored on a blockchain that automatically execute when predetermined conditions are met. Nick Szabo first proposed the concept in 1994, but they became practical with Ethereum's launch in 2015. Unlike traditional contracts that require intermediaries like lawyers or notaries, smart contracts enforce terms through code.

A smart contract works by following simple "if/then" logic. For example, a crowdfunding smart contract might state: if the funding goal is reached by the deadline, transfer all funds to the project creator; otherwise, return funds to contributors. Once deployed, the contract runs exactly as programmed — no one can alter its behavior.

This immutability is both a strength and a risk. While it prevents tampering, bugs in smart contract code cannot be easily fixed after deployment. The 2016 DAO hack exploited a reentrancy vulnerability, draining $60 million in Ether. This event led to a controversial hard fork of the Ethereum blockchain.

Smart contracts now power decentralized finance (DeFi) protocols, NFT marketplaces, supply chain tracking systems, and decentralized autonomous organizations. Their applications continue to expand as developers build more sophisticated logic and security auditing practices improve.`,
    keyPoints: [
      { text: 'Smart contracts execute automatically when predetermined conditions are met, without intermediaries', verified: true },
      { text: 'Nick Szabo proposed the concept in 1994, but Ethereum made them practical in 2015', verified: true },
      { text: 'Immutability prevents tampering but means bugs cannot be easily fixed after deployment', verified: true },
      { text: 'The 2016 DAO hack exploited a reentrancy vulnerability, draining $60 million', verified: true },
      { text: 'Smart contracts power DeFi, NFT marketplaces, supply chain tracking, and DAOs', verified: true },
    ],
    createdAt: '2024-01-02T00:00:00.000Z',
    createdBy: 'system-seed',
  },
  {
    id: 'curated-3',
    title: 'Understanding DeFi: Decentralized Finance Explained',
    source: 'curated',
    keyPointSource: 'human',
    status: 'ready',
    authors: ['FinTech Research Group'],
    year: 2021,
    contentHash: 'hash-defi-explained-2021',
    wordCount: 181,
    mainIdea: 'DeFi uses blockchain smart contracts to provide financial services like lending, borrowing, and trading without traditional intermediaries.',
    text: `Decentralized Finance, or DeFi, refers to financial services built on blockchain networks that operate without traditional banks or brokerages. DeFi protocols use smart contracts to automate lending, borrowing, trading, and earning interest on crypto assets. The total value locked in DeFi protocols grew from under $1 billion in early 2020 to over $100 billion by late 2021.

The core innovation of DeFi is the automated market maker (AMM). Traditional exchanges use order books to match buyers and sellers. AMMs instead use liquidity pools — smart contracts holding pairs of tokens that anyone can trade against. Liquidity providers deposit tokens into these pools and earn fees from every trade. Uniswap, one of the largest AMMs, processes billions of dollars in weekly volume.

DeFi lending platforms like Aave and Compound allow users to supply assets to earn interest or borrow against their crypto holdings. Interest rates adjust algorithmically based on supply and demand. Flash loans, unique to DeFi, let users borrow any amount without collateral as long as the loan is repaid within a single transaction.

Despite its innovation, DeFi faces significant challenges including smart contract vulnerabilities, regulatory uncertainty, and the risk of impermanent loss for liquidity providers. The space continues to evolve rapidly with new protocols addressing these limitations.`,
    keyPoints: [
      { text: 'DeFi protocols use smart contracts to automate financial services without banks or brokerages', verified: true },
      { text: 'Automated market makers use liquidity pools instead of order books to enable trading', verified: true },
      { text: 'DeFi lending platforms adjust interest rates algorithmically based on supply and demand', verified: true },
      { text: 'Flash loans allow borrowing without collateral if repaid within a single transaction', verified: true },
      { text: 'Key challenges include smart contract vulnerabilities, regulatory uncertainty, and impermanent loss', verified: true },
    ],
    createdAt: '2024-01-03T00:00:00.000Z',
    createdBy: 'system-seed',
  },
  {
    id: 'curated-4',
    title: 'What Are NFTs and Why Do They Matter?',
    source: 'curated',
    keyPointSource: 'human',
    status: 'ready',
    authors: ['Digital Assets Working Group'],
    year: 2022,
    contentHash: 'hash-nfts-matter-2022',
    wordCount: 196,
    mainIdea: 'NFTs are unique blockchain-verified digital assets that solve the problem of digital scarcity and ownership verification.',
    text: `Non-Fungible Tokens (NFTs) are unique digital assets verified using blockchain technology. Unlike cryptocurrencies such as Bitcoin, where each unit is interchangeable, each NFT has a distinct identifier that makes it one-of-a-kind. NFTs can represent ownership of digital art, music, virtual real estate, in-game items, and even real-world assets.

NFTs work through smart contracts, primarily on the Ethereum blockchain using the ERC-721 standard. When an artist creates an NFT, the smart contract records metadata including the creator's address, a link to the digital file, and ownership history. This provenance is permanently stored on the blockchain, creating a verifiable chain of ownership.

The NFT market exploded in 2021, with sales reaching $25 billion. Digital artist Beeple sold an NFT for $69 million at Christie's auction house, bringing mainstream attention to the space. However, the market experienced a significant correction in 2022 and 2023.

Beyond art, NFTs have practical applications. They can serve as event tickets that prevent counterfeiting, represent academic credentials, or enable royalty payments to creators on secondary sales. The technology fundamentally addresses the problem of digital scarcity — proving that a digital item is genuinely original and owned by a specific person in a world where copying digital files is trivial.`,
    keyPoints: [
      { text: 'Each NFT has a distinct identifier making it unique, unlike interchangeable cryptocurrencies', verified: true },
      { text: 'NFTs use smart contracts (primarily ERC-721 on Ethereum) to record metadata and ownership history', verified: true },
      { text: 'The NFT market reached $25 billion in 2021 sales before experiencing significant correction', verified: true },
      { text: 'Practical applications include anti-counterfeit tickets, academic credentials, and automatic creator royalties', verified: true },
      { text: 'NFTs solve digital scarcity by proving originality and ownership in a world where copying is trivial', verified: true },
    ],
    createdAt: '2024-01-04T00:00:00.000Z',
    createdBy: 'system-seed',
  },
  {
    id: 'curated-5',
    title: 'Distributed Ledger Technology Beyond Cryptocurrency',
    source: 'curated',
    keyPointSource: 'human',
    status: 'ready',
    authors: ['Enterprise Blockchain Consortium'],
    year: 2020,
    contentHash: 'hash-dlt-beyond-crypto-2020',
    wordCount: 174,
    mainIdea: 'Distributed ledger technology extends beyond cryptocurrency to solve trust and coordination problems in supply chains, healthcare, and identity.',
    text: `Distributed Ledger Technology (DLT) is a digital system for recording, sharing, and synchronizing data across multiple locations without a central administrator. While blockchain is the most famous type of DLT, other architectures exist, including Directed Acyclic Graphs (DAGs) used by IOTA and Hashgraph used by Hedera.

In supply chain management, DLT enables end-to-end visibility. Walmart uses a blockchain-based system to trace the origin of food products in seconds rather than the days it previously took. When a contamination issue arises, the company can identify affected batches instantly, potentially saving lives and reducing waste.

Healthcare organizations explore DLT for managing patient records. A distributed system allows different hospitals and clinics to share records securely while giving patients control over who accesses their data. Estonia's national health system uses blockchain to secure over a million patient records.

DLT also transforms identity verification. Self-sovereign identity systems let individuals store verified credentials on their devices and share only the minimum necessary information. Instead of showing a full ID to prove your age, you could share a cryptographic proof that confirms you are over 18 without revealing your exact birthdate.

These applications demonstrate that the true value of distributed ledger technology extends far beyond digital currencies into solving fundamental trust and coordination problems.`,
    keyPoints: [
      { text: 'DLT includes architectures beyond blockchain, such as DAGs (IOTA) and Hashgraph (Hedera)', verified: true },
      { text: 'Walmart uses blockchain to trace food product origins in seconds instead of days', verified: true },
      { text: 'Estonia uses blockchain to secure over a million patient health records', verified: true },
      { text: 'Self-sovereign identity lets individuals share minimum necessary verified credentials', verified: true },
      { text: 'DLT solves fundamental trust and coordination problems beyond digital currencies', verified: true },
    ],
    createdAt: '2024-01-05T00:00:00.000Z',
    createdBy: 'system-seed',
  },
  {
    id: 'curated-6',
    title: 'RESTful APIs: The Backbone of Modern Web Services',
    source: 'curated',
    keyPointSource: 'human',
    status: 'ready',
    authors: ['Roy Fielding'],
    year: 2020,
    contentHash: 'hash-restful-apis-2020',
    wordCount: 177,
    mainIdea: 'REST is a stateless, resource-based architectural style using standard HTTP methods that has become the dominant approach for web APIs.',
    text: `REST (Representational State Transfer) is an architectural style for designing networked applications. Proposed by Roy Fielding in his 2000 doctoral dissertation, REST has become the dominant approach for building web APIs. RESTful APIs use standard HTTP methods — GET for reading, POST for creating, PUT for updating, and DELETE for removing resources.

A key principle of REST is statelessness. Each request from a client must contain all the information needed to process it. The server does not store session state between requests. This design makes REST APIs highly scalable because any server instance can handle any request.

Resources in REST are identified by URLs. A well-designed API uses nouns for endpoints (/users, /articles) rather than verbs (/getUser, /createArticle). Responses typically use JSON format and include appropriate HTTP status codes: 200 for success, 201 for creation, 404 for not found, and 500 for server errors.

REST APIs power most modern web and mobile applications. When you check weather on your phone, scroll social media, or make an online payment, your device is communicating with servers through RESTful APIs. Companies like Twitter, GitHub, and Stripe expose public REST APIs that developers use to build integrations.

While alternatives like GraphQL and gRPC have emerged for specific use cases, REST remains the most widely adopted API architecture due to its simplicity, flexibility, and alignment with HTTP standards.`,
    keyPoints: [
      { text: 'REST uses standard HTTP methods: GET for reading, POST for creating, PUT for updating, DELETE for removing', verified: true },
      { text: 'Statelessness means each request contains all information needed, enabling horizontal scalability', verified: true },
      { text: 'Resources are identified by URLs using nouns (not verbs) for endpoints', verified: true },
      { text: 'REST APIs power most modern web and mobile applications through JSON responses with HTTP status codes', verified: true },
      { text: 'Alternatives like GraphQL and gRPC exist but REST remains dominant due to simplicity and HTTP alignment', verified: true },
    ],
    createdAt: '2024-01-06T00:00:00.000Z',
    createdBy: 'system-seed',
  },
  {
    id: 'curated-7',
    title: 'Microservices Architecture: Breaking Down the Monolith',
    source: 'curated',
    keyPointSource: 'human',
    status: 'ready',
    authors: ['Software Architecture Standards'],
    year: 2021,
    contentHash: 'hash-microservices-arch-2021',
    wordCount: 181,
    mainIdea: 'Microservices decompose applications into small independent services enabling flexible deployment but introducing distributed system complexity.',
    text: `Microservices architecture structures an application as a collection of small, independent services that communicate over a network. Each service handles a specific business capability, runs its own process, and can be deployed independently. This contrasts with monolithic architecture, where all functionality resides in a single deployable unit.

The benefits of microservices include independent deployment, technology flexibility, and resilience. Teams can update one service without redeploying the entire application. Each service can use the programming language and database best suited to its needs. If one service fails, others continue operating.

Netflix is a prominent example of microservices adoption. The streaming platform runs over 700 microservices that handle everything from user authentication to video encoding to recommendation algorithms. Each service has its own team and deployment pipeline.

However, microservices introduce complexity. Network communication between services can fail or slow down. Distributed transactions are harder to manage than local database transactions. Monitoring and debugging require sophisticated tooling like distributed tracing. The overhead of managing dozens or hundreds of services may not be justified for smaller applications.

Successful microservices adoption requires investment in DevOps practices, including containerization with Docker, orchestration with Kubernetes, CI/CD pipelines, and comprehensive monitoring. Organizations typically start with a monolith and gradually extract services as the system grows.`,
    keyPoints: [
      { text: 'Each microservice handles a specific business capability and can be deployed independently', verified: true },
      { text: 'Benefits include independent deployment, technology flexibility per service, and fault isolation', verified: true },
      { text: 'Netflix runs over 700 microservices for functions from authentication to video encoding', verified: true },
      { text: 'Challenges include network failures, distributed transactions, and complex monitoring needs', verified: true },
      { text: 'Successful adoption requires Docker, Kubernetes, CI/CD pipelines, and distributed tracing', verified: true },
    ],
    createdAt: '2024-01-07T00:00:00.000Z',
    createdBy: 'system-seed',
  },
  {
    id: 'curated-8',
    title: 'CI/CD Pipelines: Automating Software Delivery',
    source: 'curated',
    keyPointSource: 'human',
    status: 'ready',
    authors: ['DevOps Institute'],
    year: 2022,
    contentHash: 'hash-cicd-pipelines-2022',
    wordCount: 186,
    mainIdea: 'CI/CD automates building, testing, and deploying software to enable frequent, reliable releases through continuous feedback loops.',
    text: `Continuous Integration and Continuous Delivery (CI/CD) is a set of practices that automate the building, testing, and deployment of software. CI ensures that code changes from multiple developers are merged and tested frequently, typically several times per day. CD extends this by automatically preparing or deploying tested code to production environments.

In a CI pipeline, every code commit triggers an automated process: the code is compiled, unit tests run, code quality checks execute, and integration tests verify that components work together. If any step fails, the team is immediately notified. This rapid feedback loop catches bugs early when they are cheapest to fix.

CD takes two forms. Continuous Delivery means code is always in a deployable state, but a human triggers the actual deployment. Continuous Deployment goes further — every change that passes all tests is automatically deployed to production. Companies like Amazon deploy code thousands of times per day using continuous deployment.

Popular CI/CD tools include Jenkins, GitHub Actions, GitLab CI, and CircleCI. Cloud providers offer managed services like AWS CodePipeline and Google Cloud Build. Modern pipelines also include security scanning, performance testing, and canary deployments that gradually roll out changes to a subset of users.

CI/CD fundamentally changes how teams deliver software, shifting from monthly or quarterly releases to a continuous flow of small, well-tested changes. This reduces deployment risk and accelerates the feedback loop between development and users.`,
    keyPoints: [
      { text: 'CI merges and tests code changes frequently, catching bugs early through automated pipelines', verified: true },
      { text: 'Continuous Delivery keeps code deployable; Continuous Deployment automatically deploys passing changes', verified: true },
      { text: 'Amazon deploys code thousands of times per day using continuous deployment', verified: true },
      { text: 'Pipelines include compilation, unit tests, integration tests, security scanning, and canary deployments', verified: true },
      { text: 'CI/CD shifts delivery from monthly releases to continuous flow of small, well-tested changes', verified: true },
    ],
    createdAt: '2024-01-08T00:00:00.000Z',
    createdBy: 'system-seed',
  },
  {
    id: 'curated-9',
    title: 'Edge Computing: Processing Data Where It Is Generated',
    source: 'curated',
    keyPointSource: 'human',
    status: 'ready',
    authors: ['Edge Consortium'],
    year: 2023,
    contentHash: 'hash-edge-computing-2023',
    wordCount: 184,
    mainIdea: 'Edge computing processes data near its source to reduce latency and enable real-time decisions, complementing cloud computing.',
    text: `Edge computing is a distributed computing paradigm that brings computation and data storage closer to the sources of data. Rather than sending all data to a centralized cloud data center for processing, edge computing processes data at or near the device that generates it. This approach reduces latency, conserves bandwidth, and enables real-time decision-making.

The growth of IoT devices drives edge computing adoption. A self-driving car generates approximately 1.4 terabytes of data per hour from cameras, lidar, and sensors. Sending this data to the cloud for processing and waiting for a response is simply too slow for safety-critical decisions. The car must process data locally in milliseconds.

Content delivery networks (CDNs) represent an early form of edge computing. Companies like Cloudflare and Akamai cache content at edge locations worldwide, reducing page load times by serving content from the nearest server. Modern edge platforms extend this to run application code, not just serve static files.

In manufacturing, edge computing enables predictive maintenance. Sensors on factory equipment analyze vibration patterns and temperature data locally to detect potential failures before they occur. This prevents costly downtime without requiring constant cloud connectivity.

Edge computing complements rather than replaces cloud computing. Computationally intensive tasks like model training still happen in the cloud, while inference and real-time processing occur at the edge. This hybrid approach optimizes both cost and performance.`,
    keyPoints: [
      { text: 'Edge computing brings computation closer to data sources to reduce latency and conserve bandwidth', verified: true },
      { text: 'Self-driving cars generate about 1.4 TB/hour and must process data locally in milliseconds', verified: true },
      { text: 'CDNs are an early form of edge computing, now extended to run application code at edge locations', verified: true },
      { text: 'Manufacturing uses edge computing for predictive maintenance by analyzing sensor data locally', verified: true },
      { text: 'Edge complements cloud: real-time inference at edge, computationally intensive training in cloud', verified: true },
    ],
    createdAt: '2024-01-09T00:00:00.000Z',
    createdBy: 'system-seed',
  },
  {
    id: 'curated-10',
    title: 'Web3: The Vision for a Decentralized Internet',
    source: 'curated',
    keyPointSource: 'human',
    status: 'ready',
    authors: ['Decentralized Web Foundation'],
    year: 2022,
    contentHash: 'hash-web3-vision-2022',
    wordCount: 185,
    mainIdea: 'Web3 envisions a decentralized internet built on blockchain where users own their data, identity, and digital assets instead of platforms.',
    text: `Web3 represents a vision for the next evolution of the internet, built on blockchain technology and decentralized protocols. Web1 (1990s–2000s) was the read-only web of static pages. Web2 (2000s–present) introduced user-generated content through platforms like Facebook, YouTube, and Twitter. Web3 proposes an internet where users own their data, identity, and digital assets.

The core idea behind Web3 is disintermediation — removing the powerful middlemen that control Web2. Instead of platforms owning user data and content, blockchain-based systems would let users retain ownership. Decentralized storage networks like IPFS and Filecoin aim to replace centralized cloud storage, while decentralized social protocols like Lens and Farcaster challenge traditional social media.

Web3 applications, called dApps, run on blockchain networks rather than centralized servers. Users interact with dApps through cryptocurrency wallets like MetaMask, which serve as both payment tool and identity credential. This eliminates the need for separate accounts on every platform.

Decentralized Autonomous Organizations (DAOs) represent Web3's approach to governance. Token holders vote on proposals to direct the organization's resources and strategy. Some DAOs manage treasuries worth hundreds of millions of dollars.

Critics argue that Web3 is overly complex for average users, environmentally costly, and often recreates centralization through different means. Proponents counter that the technology is still maturing and that ownership-based internet models will eventually prove superior to advertising-based ones.`,
    keyPoints: [
      { text: 'Web3 follows Web1 (read-only static) and Web2 (user-generated content on centralized platforms)', verified: true },
      { text: 'Core idea is disintermediation: removing platform middlemen so users retain data ownership', verified: true },
      { text: 'Decentralized storage (IPFS, Filecoin) and social protocols (Lens, Farcaster) aim to replace centralized services', verified: true },
      { text: 'Users interact with dApps through crypto wallets like MetaMask for both payment and identity', verified: true },
      { text: 'DAOs use token-based voting for governance, some managing treasuries worth hundreds of millions', verified: true },
      { text: 'Critics cite complexity for average users and potential recreation of centralization', verified: true },
    ],
    createdAt: '2024-01-10T00:00:00.000Z',
    createdBy: 'system-seed',
  },
];

export const CURATED_ARTICLES: Article[] = RAW_ARTICLES.map((article) => {
  const actualWordCount = countWords(article.text);
  const sections = splitSections(article.text);
  return {
    ...article,
    wordCount: actualWordCount,
    sections,
  };
});

/**
 * Returns list of curated articles, optionally filtered by source
 */
export function getCuratedArticles(source?: string | null): Article[] {
  if (!source) return CURATED_ARTICLES;
  return CURATED_ARTICLES.filter((a) => a.source === source);
}

/**
 * Returns a single curated article by ID (e.g. 'curated-1')
 */
export function getCuratedArticleById(id: string): Article | undefined {
  return CURATED_ARTICLES.find((a) => a.id === id);
}
