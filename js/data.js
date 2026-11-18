/* ------------------------------------------------------------------
   Hindustan Foundation & Constructions - project data
   Edit this file to add / change clients and projects.
   (No contract values and no staff names are published on the site.)
   Image keys point to  images/work/<key>-<n>.webp
------------------------------------------------------------------- */
(function () {
  const w = (key, n) => `images/work/${key}-${n}.webp`;
  const imgs = (key, count) => Array.from({ length: count }, (_, i) => w(key, i + 1));
  const site = (n) => `images/site/s${String(n).padStart(2, '0')}.webp`;

  /* ---------- clients (logo rail) ---------- */
  const logo = (id, ext) => `images/logos/${id}.${ext || 'png'}`;
  const C = {
    lnt:       { name: 'L&T Construction',               logo: logo('lnt'),       bg: '#ffffff' },
    k2k:       { name: 'K2K Infrastructure',             logo: logo('k2k'),       bg: '#ffffff' },
    kalpataru: { name: 'Kalpataru Projects International', logo: logo('kalpataru'), bg: '#fbfbfb' },
    puravankara:{ name: 'Puravankara',                   logo: logo('puravankara', 'svg'), bg: '#ffffff' },
    sattva:    { name: 'Salarpuria Sattva',              logo: logo('sattva'),    bg: '#ffffff' },
    divyasree: { name: 'Divyasree',                      logo: logo('divyasree'), bg: '#000000' },
    prestige:  { name: 'Prestige Group',                 logo: logo('prestige'),  bg: '#000000' },
    ncc:       { name: 'Nagarjuna Construction Company', logo: logo('ncc'),       bg: '#ffffff' },
    sp:        { name: 'Shapoorji Pallonji',             logo: logo('sp'),        bg: '#000000' },
    mana:      { name: 'Mana Projects',                  logo: logo('mana'),      bg: '#ffffff' },
    vajram:    { name: 'Vajram',                         logo: logo('vajram'),    bg: '#ffffff' },
    casagrand: { name: 'Casagrand',                      logo: logo('casagrand'), bg: '#fefdfe' },
    goyal:     { name: 'Goyal & Co.',                    logo: logo('goyal'),     bg: '#000000' },
    mantri:    { name: 'Mantri Developers',              logo: logo('mantri'),    bg: '#ffffff' },
    microlabs: { name: 'Micro Labs',                     logo: logo('microlabs'), bg: '#ffffff' },
    mcf:       { name: 'Mangalore Chemicals & Fertilizers', logo: logo('mcf'),    bg: '#ffffff' },
    gayatri:   { name: 'Gayatri Projects',               logo: logo('gayatri'),   bg: '#ffffff' },
    kmv:       { name: 'KMV Projects',                   logo: logo('kmv'),       bg: '#ffffff' },
    passavant: { name: 'Passavant Energy & Environment', logo: logo('passavant'), bg: '#ffffff' },
    nsl:       { name: 'NSL Constructions',              logo: logo('nsl'),       bg: '#fffefc' },
    bbmp:      { name: 'BBMP',                           logo: logo('bbmp'),      bg: '#ffffff' },
    bricks:    { name: 'Bricks & Milestones',            logo: logo('bricks'),    bg: '#fbfbfb' }
  };

  /* ---------- ongoing projects (section 2) ---------- */
  const ongoing = [
    {
      name: 'Prestige Century Megacity', client: 'k2k', loc: 'Bengaluru', since: '2025',
      stat: { n: '866', l: 'bored piles' },
      desc: 'Bored pile foundations with rotary rigs and excavators working the full footprint in parallel.',
      img: w('century-megacity', 1), pos: '50% 60%'
    },
    {
      name: 'Purva Northern Lights', client: 'puravankara', loc: 'Bengaluru', since: '2025',
      stat: { n: '1,352', l: 'bored piles' },
      desc: 'Piling for the residential towers, with pile heads trimmed and exposed at foundation level.',
      img: w('northern-lights', 1), pos: '50% 70%'
    },
    {
      name: 'Solcrest', client: 'bricks', loc: 'Bengaluru', since: '2025',
      desc: 'Pile foundations for the Bricks & Milestones residential development, rigs mobilised and boring.',
      img: site(9), pos: '50% 55%'
    },
    {
      name: 'Residential Apartments', client: 'sattva', loc: 'Bengaluru', since: '2025',
      desc: 'Pile foundations for a new Salarpuria Sattva apartment block.',
      img: site(8), pos: '50% 60%'
    },
    {
      name: 'Purva Oakshire', client: 'puravankara', loc: 'Bengaluru', since: '2025',
      desc: 'Pile foundations for the Oakshire residential development.',
      img: site(14), pos: '50% 60%'
    }
  ];

  /* ---------- completed projects grouped by client (section 3) ---------- */
  const completed = [
    { id: 'lnt', fallback: site(19), projects: [
      { name: 'Prestige Park Grove', loc: 'Kadugodi', yrs: '2023-25', desc: 'Villa, tower and 1200 mm shoring piles plus rock-anchor load testing: over 4,200 piles in all.', imgs: imgs('park-grove', 6) },
      { name: 'Kempegowda Airport, Terminal 2', loc: 'BIAL', yrs: '2020-21', desc: 'Signature bridge, south-west tunnel shoring and ancillary-building piles with static load tests.', imgs: imgs('bial', 4) },
      { name: 'Kempegowda Airport, Terminal 1', loc: 'BIAL', yrs: '2018-19', desc: 'Pile foundations for the ancillary building at the airport’s first terminal.', imgs: [w('bial', 3)] },
      { name: 'Wipro IT-SEZ', loc: 'Kodathi', yrs: '2017-18', desc: 'Pile foundations for the multi-block IT-SEZ campus.', imgs: imgs('wipro', 2) },
      { name: 'Prestige Sunrise Park', loc: 'Electronic City', yrs: '2016-17', desc: 'Bored piles for a large residential township.', imgs: imgs('sunrise', 2) },
      { name: 'Prestige Song of the South', loc: 'Begur', yrs: '2016-17', desc: 'Piling for the residential community at Begur.', imgs: imgs('song-south', 3) },
      { name: 'Prestige Lakeside Habitat', loc: 'Varthur', yrs: '2014-15', desc: 'Pile foundations for the lakeside residential development.', imgs: [] },
      { name: 'BWSSB CP-26 Project', loc: 'Naganathapura', yrs: '2022-23', desc: 'Pile foundations for the BWSSB CP-26 infrastructure package.', imgs: [] }
    ]},
    { id: 'k2k', fallback: site(13), projects: [
      { name: 'Prestige Lake Shore Drive', loc: 'Bellandur', yrs: '2021-22', desc: 'Piling for the lakeside campus, with rock-anchor static load tests beyond 900 MT.', imgs: imgs('lakeshore', 4) },
      { name: 'Prestige Century Landmark', loc: 'Hebbal', yrs: '2024-25', desc: 'Pile foundations for the Hebbal commercial development.', imgs: imgs('century-landmark', 2) }
    ]},
    { id: 'kalpataru', fallback: site(10), projects: [
      { name: 'Prestige Tech Forest', loc: 'Varthur', yrs: '2022-23', desc: '2,227 piles for the tech campus, proof-tested with a 750 MT kentledge static load test.', imgs: imgs('tech-forest', 5) },
      { name: 'Prestige Raintree Park', loc: 'Varthur', yrs: '2024-25', desc: '2,379 bored piles for the residential community, drilled by a line-up of rotary rigs.', imgs: imgs('raintree', 4) },
      { name: 'Prestige King County', loc: 'Jigani', yrs: '2023-25', desc: 'Pile foundations for the Jigani township development.', imgs: imgs('king-county', 1) },
      { name: 'Infosys Building', loc: 'Electronic City', yrs: '2024-25', desc: 'Piling for a new Infosys building at Electronic City.', imgs: [] }
    ]},
    { id: 'puravankara', fallback: w('northern-lights', 1), projects: [
      { name: 'Purva Sound of Water', loc: 'Kammanahalli', yrs: '2016-17', desc: 'Pile foundations for the residential development at Kammanahalli.', imgs: [] },
      { name: 'Purva Northern Lights', loc: 'Bengaluru', yrs: 'Ongoing', desc: '1,352 bored piles for the towers, currently under way.', imgs: [w('northern-lights', 1)] },
      { name: 'Purva Oakshire', loc: 'Bengaluru', yrs: 'Ongoing', desc: 'Pile foundations for the Oakshire residential development.', imgs: [site(14)] }
    ]},
    { id: 'sattva', fallback: site(21), projects: [
      { name: 'Sattva Aeropolis', loc: 'Boovanahalli', yrs: '2024-25', desc: 'Pile foundations for the residential community.', imgs: imgs('aeropolis', 3) },
      { name: 'Salarpuria Indus Park', loc: 'Sarjapur Road', yrs: '2019-21', desc: 'Piling for the commercial towers on Sarjapur Road.', imgs: imgs('indus-park', 1) },
      { name: 'Sattva Aqua Vista', loc: '', yrs: '2014-16', desc: 'Pile foundations for the residential development.', imgs: [] },
      { name: 'Raja Nala', loc: 'Domlur', yrs: '2016-17', desc: 'Piling for the Domlur development.', imgs: [] },
      { name: 'Salarpuria Galleria', loc: 'Sahakar Nagar', yrs: '2015-16', desc: 'Pile foundations for the Sahakar Nagar project.', imgs: [] },
      { name: 'Salarpuria Magnificia', loc: 'Tin Factory', yrs: '2013-14', desc: 'Pile foundations for the Tin Factory development.', imgs: [] },
      { name: 'Sattva Luxuria', loc: 'Malleshwaram', yrs: '2012-13', desc: 'Pile foundations for the Malleshwaram residences.', imgs: [] },
      { name: 'Salarpuria Premia', loc: '', yrs: '2012-13', desc: 'Early piling work for the Premia development.', imgs: [] }
    ]},
    { id: 'divyasree', fallback: site(3), projects: [
      { name: 'Divyasree 77° East', loc: 'Kadubeesanahalli', yrs: '2013-15', desc: 'Pile foundations for the East villas.', imgs: imgs('div-east', 2) },
      { name: 'Divyasree 77° LIFE', loc: 'Kadubeesanahalli', yrs: '', desc: 'Pile foundations for the LIFE apartments.', imgs: imgs('div-life', 1) },
      { name: 'Divyasree Techno Park', loc: '', yrs: '2011-12', desc: 'Piling for the techno park buildings.', imgs: imgs('div-techno', 2) },
      { name: 'Divyasree Technopolis', loc: 'Marathalli', yrs: '2011-13', desc: 'Foundation piling for the Technopolis campus.', imgs: [w('div-techno', 1)] },
      { name: 'Divyasree 77° Place', loc: 'Marathalli', yrs: '2015-17', desc: 'Pile foundations for the residential blocks.', imgs: [w('div-east', 1)] },
      { name: 'Divyasree Republic of Whitefield', loc: 'Whitefield', yrs: '2014-16', desc: 'Piling for the Whitefield development.', imgs: [] },
      { name: 'Divyasree Doublement', loc: '', yrs: '2013-15', desc: 'Pile foundations for the apartment blocks.', imgs: [] },
      { name: 'Divyasree Greens', loc: 'Domlur', yrs: '2016-17', desc: 'Pile foundations for the Domlur project.', imgs: [] }
    ]},
    { id: 'prestige', fallback: site(6), projects: [
      { name: 'Prestige Shantiniketan', loc: 'Whitefield', yrs: '2011-12', desc: 'Pile foundations for the township, including Tower 3.', imgs: [] }
    ]},
    { id: 'ncc', fallback: site(16), projects: [
      { name: 'Project Seabird', loc: 'Karwar', yrs: '2019-21', desc: 'Foundation piling for the naval base works at Karwar.', imgs: [] },
      { name: 'Prestige Spencer Heights', loc: 'Fraser Town', yrs: '2014-16', desc: 'Pile foundations for the Fraser Town residences.', imgs: [] },
      { name: 'Mantri Blossom', loc: 'Lalbagh', yrs: '2015-16', desc: 'Pile foundations for the Lalbagh tower.', imgs: imgs('mantri-blossom', 1) }
    ]},
    { id: 'sp', fallback: site(10), projects: [
      { name: 'Project Seabird', loc: 'Karwar', yrs: '2019-21', desc: 'Foundation piling for the naval base works at Karwar.', imgs: [] },
      { name: 'Chemical Synthesis Facility (Project 1401)', loc: 'Mangalore', yrs: '2017-18', desc: 'Piles for a chemical-synthesis manufacturing facility.', imgs: [] }
    ]},
    { id: 'mana', fallback: site(14), projects: [
      { name: 'Mana Verdant', loc: 'Jakkur', yrs: '2024-25', desc: '447 bored piles for the residential towers off Jakkur Main Road.', imgs: imgs('mana', 3) }
    ]},
    { id: 'vajram', fallback: site(19), projects: [
      { name: 'Vajram Newtown Phase II', loc: 'Thanisandra', yrs: '2024-25', desc: '229 piles for the high-rise residential blocks.', imgs: imgs('vajram', 3) }
    ]},
    { id: 'casagrand', fallback: site(21), projects: [
      { name: 'Casagrand Florella', loc: 'Sarjapur', yrs: '2021-22', desc: 'Pile foundations for the villa community.', imgs: imgs('casagrand', 2) }
    ]},
    { id: 'goyal', fallback: site(8), projects: [
      { name: 'Orchid Bloomsberry', loc: 'Varthur', yrs: '2024-25', desc: 'Pile foundations for the residential towers.', imgs: imgs('goyal', 2) }
    ]},
    { id: 'mantri', fallback: site(9), projects: [
      { name: 'Mantri Blossom', loc: '', yrs: '2025-26', desc: 'Pile foundations for the Blossom residential tower.', imgs: imgs('mantri-blossom', 1) },
      { name: 'Mantri Corner Stone', loc: 'Indiranagar', yrs: '2015-16', desc: 'Pile foundations for the Indiranagar project.', imgs: [] }
    ]},
    { id: 'microlabs', fallback: site(14), projects: [
      { name: 'ML 28 & ML 38 Plant', loc: 'Jigani', yrs: '2025-26', desc: 'Foundation piling for two new production plants.', imgs: [] },
      { name: 'Warehouse', loc: 'Jigani', yrs: '2019-20', desc: 'Pile foundations for the Jigani warehouse.', imgs: [] },
      { name: 'API Building', loc: 'Jigani', yrs: '2011-12', desc: 'Foundation piling for the API manufacturing building.', imgs: [] },
      { name: 'Warehouse', loc: 'Jigani', yrs: '2010-11', desc: 'Our first piling work for Micro Labs.', imgs: [] }
    ]},
    { id: 'mcf', fallback: site(17), projects: [
      { name: 'Sulphur Plant', loc: 'Mangalore', yrs: '2023-25', desc: 'Foundation piling inside the live fertiliser complex.', imgs: [] },
      { name: 'Ammonia Plant', loc: 'Mangalore', yrs: '2018-22', desc: 'Pile foundations for the ammonia plant.', imgs: [] },
      { name: 'Natural-gas Conversion Power Plant', loc: 'Mangalore', yrs: '2011-12', desc: 'Piles for the power-plant conversion works.', imgs: [] },
      { name: 'Multipurpose Warehouse', loc: 'Mangalore', yrs: '2010-11', desc: 'Pile foundations for the warehouse.', imgs: [] }
    ]},
    { id: 'gayatri', fallback: w('aqueduct', 1), projects: [
      { name: 'Basaveshwara Lift Irrigation Scheme', loc: 'Athani, Belagavi', yrs: '2018-19', desc: 'Aqueduct piling for the Karnataka Neeravari Nigam scheme, proven by pile load testing.', imgs: imgs('aqueduct', 3) }
    ]},
    { id: 'kmv', fallback: site(18), projects: [
      { name: 'Modern Bus Terminal', loc: 'Kalasipalya', yrs: '2017-18', desc: 'Pile foundations for the bus terminal.', imgs: [] },
      { name: 'Bangalore Medical College', loc: 'Kalasipalya', yrs: '2014-15', desc: 'Piling for the medical college buildings.', imgs: [] }
    ]},
    { id: 'passavant', fallback: site(17), projects: [
      { name: 'Sewage Treatment Plants', loc: 'Dodabettahalli, Yelahanka, Billeshivalli', yrs: '2024-25', desc: 'Foundation piling for three STPs.', imgs: [] }
    ]},
    { id: 'nsl', fallback: site(10), projects: [
      { name: 'PWD Quarters', loc: 'Vasanth Nagar', yrs: '2022-23', desc: 'Pile foundations for the PWD quarters.', imgs: [] }
    ]},
    { id: 'bbmp', fallback: site(18), projects: [
      { name: 'Waste Weir, Sankey Tank', loc: 'Bengaluru', yrs: '2016-17', desc: 'Foundation piling for the waste weir at Sankey Tank.', imgs: [] }
    ]}
  ];

  /* more partners: defence, government, industry, institutions */
  const more = {
    name: 'More partners', fallback: site(16),
    projects: [
      { name: 'LCH Hangar knock-out pit', loc: 'HAL Foundry & Forge', yrs: '2017-18', desc: 'Hindustan Aeronautics Limited.', imgs: [] },
      { name: 'Radar project', loc: 'DRDO, Kolar', yrs: '2016-17', desc: 'Sree Krishna Constructions.', imgs: [] },
      { name: 'Rain-water harvesting', loc: 'Air Force Station', yrs: '2012-13', desc: 'Brindavan Energy & Infra.', imgs: [] },
      { name: 'Hebbal Flyover', loc: 'Bengaluru', yrs: '2016-17', desc: 'Ramsons Infrastructure.', imgs: [] },
      { name: 'Underpass, Embassy Habitat', loc: 'Bengaluru', yrs: '2010-11', desc: 'Embassy Habitat.', imgs: [] },
      { name: 'Traffic & Transit Centre', loc: 'Nanjangud', yrs: '2014-15', desc: 'KSRTC.', imgs: [] },
      { name: 'ESIC Dispensary & Diagnostic Centre', loc: 'Nanjangud', yrs: '2017-18', desc: 'USHA Constructions.', imgs: [] },
      { name: 'Pump House, KC Valley', loc: 'Bengaluru', yrs: '2017-18', desc: 'Megha Engineering & Infrastructure.', imgs: [] },
      { name: 'Manyata Tech Park', loc: 'Bengaluru', yrs: '2010-11', desc: 'Manyata Promoters.', imgs: [] },
      { name: 'Commercial complex', loc: 'Mysore Road', yrs: '2013-14', desc: 'LSK Projects.', imgs: [] },
      { name: 'Aubergine Bonsai commercial complex', loc: 'Kadugodi', yrs: '2014-15', desc: 'Bonsai.', imgs: [] },
      { name: 'Pothys', loc: 'K.G. Road', yrs: '2016-17', desc: 'BBR (India).', imgs: [] },
      { name: 'Bangalore International School', loc: 'Hennur', yrs: '2016-17', desc: 'School campus piling.', imgs: [] },
      { name: 'Purva Sunflower', loc: 'Magadi Road', yrs: '2013-14', desc: 'StarWorth Infrastructure.', imgs: [] },
      { name: 'Purva Skydale', loc: 'Haralur', yrs: '2013-14', desc: 'StarWorth Infrastructure.', imgs: [] },
      { name: 'Residential building', loc: 'Amco Layout, Kodigehalli', yrs: '2018-19', desc: 'Ramkrishna Infrastructure.', imgs: [] },
      { name: 'Wellman Hindustan', loc: '', yrs: '2011-12', desc: 'Essar.', imgs: [] }
    ]
  };

  window.HFC = { clients: C, ongoing, completed, more };
})();
