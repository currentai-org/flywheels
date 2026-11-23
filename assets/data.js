/*
 * Content and layout for the flywheel explorer.
 *
 * Edit the words here; the diagram redraws itself from this file.
 *   - sub: the box subtitle, one string per line.
 *   - angle: where a commons step sits on its circle (degrees, 0 = right, -90 = top).
 *   - frac: where an outer-loop step sits along its loop (0 = start, 1 = end).
 *   - w / h: box size, if the words need more room than the default 150 x 54.
 *   - about: paragraphs shown in the side panel.
 */
window.FLYWHEELS = {
  canvas: { w: 1000, h: 810 },

  commons: {
    id: "commons",
    tab: "Commons",
    title: "Commons flywheel",
    tagline: "The AI commons grows with every turn",
    legend: "Commons flywheel",
    center: [500, 430],
    radius: 175,
    hub: { title: "The AI commons", sub: "grows with every turn" },
    about: [
      "An integrated framework that helps focus the public interest AI ecosystem, so that every dollar, every grant and every line of code builds the AI commons.",
      "Each turn finds a gap, finds the people who can fill it, funds and organizes them, builds what no one else will, and lands the result in Alpha, where anyone can see it and build on it.",
      "Three outer loops feed this one. Funders bring capital, Alpha brings users, and compute donors bring capacity. Pick one above to see where it joins."
    ],
    principles: [
      "Build as little as possible, but as much as necessary.",
      "Put resources on the true choke points.",
      "Tell the builders' story, not ours.",
      "Keep momentum visible."
    ],
    nodes: [
      {
        id: "map", title: "Map", sub: ["Chart the gaps"], angle: -90,
        about: [
          "The Gap Map charts the public interest AI stack: what exists, what is being built, and where the gaps are.",
          "It covers technical gaps and the ones the market ignores, like endangered languages. Funders see where money unlocks the most, governments see which layer they can own, and builders see which gap their work fills."
        ],
        links: [{ text: "Open the Gap Map", href: "https://map.currentai.org" }]
      },
      {
        id: "discover", title: "Discover", sub: ["Scout and search"], angle: -18,
        about: [
          "Automated search and community scouting find the projects, people and tools that could fill each gap.",
          "Discovery runs in the open, so anyone can flag a gap or propose an addition."
        ]
      },
      {
        id: "invite", title: "Invite", sub: ["Fund & organize", "builders"], angle: 54, h: 72,
        about: [
          "Builders are funded and organized around the gaps, through programs such as Potluck grants, maintainer support and culture preservation grants.",
          "Organizing matters as much as funding: a shared roadmap, shared standards, and a shared place to land the work."
        ]
      },
      {
        id: "build", title: "Build", sub: ["We build only what", "no one else will"], angle: 126, h: 72,
        about: [
          "Rare, big bets where nobody else can or will build.",
          "Everything else is left to the ecosystem. The rule is to build as little as possible, but as much as necessary."
        ]
      },
      {
        id: "showcase", title: "Showcase", sub: ["Land it in Alpha"], angle: 198,
        about: [
          "Alpha is a staged apartment. It is not built to house a family. It is built so visitors can swap the sofa and picture furnishing their own home.",
          "Landing work in Alpha makes it visible, usable and easy to build on."
        ]
      }
    ]
  },

  loops: [
    {
      id: "funder",
      tab: "Funders",
      title: "Funder flywheel",
      tagline: "Capital for the commons",
      legend: "Funder flywheel",
      attach: { from: "map", to: "invite" },
      bulge: 310,
      label: { lines: ["Capital for", "the commons"], at: [796, 366] },
      about: [
        "New funders are brought into the flywheel by intersecting their interest with a gap. We help them design a grant program that feeds the flywheel and enriches the commons for all.",
        "The loop leaves the commons at Map, where a funder sees where their money unlocks the most. It returns at Invite, where the co-designed program funds builders."
      ],
      nodes: [
        {
          id: "match", title: "Match", sub: ["Find the right funder"], frac: 0.29,
          about: ["Match each funder's interest to a gap on the Map, in the funder's own terms."]
        },
        {
          id: "codesign", title: "Co-design", sub: ["Custom co-fund program"], frac: 0.69, w: 166,
          about: ["Design a grant program with the funder: their priorities, our pipeline of builders, and an open result for everyone."]
        }
      ],
      extras: [
        {
          kind: "dotted", from: "match", to: "build", off1: [-25, 0],
          legend: "Funder backs a bet",
          about: "Some funders skip the program and back a big build directly."
        }
      ]
    },
    {
      id: "alpha",
      tab: "Alpha",
      title: "Alpha flywheel",
      tagline: "Showcasing the commons",
      legend: "Alpha flywheel",
      attach: { from: "showcase", to: "map" },
      bulge: 285,
      close: true,
      label: { lines: ["Showcasing", "the commons"], at: [330, 162] },
      about: [
        "Alpha becomes a showcase of all that's possible, and a jumping off point for a government, a community or a user group to build their own AI, without starting from scratch. They can fork it, customize it and contribute back.",
        "As new versions are created, a gallery of customized AI systems emerges: Alpha for teachers, Alpha for health, Alpha for endangered languages. Each one documents how it was tuned, what problem it solved, and how others can pick it up."
      ],
      nodes: [
        {
          id: "customize", title: "Customize", sub: ["Alpha for..."], frac: 0.26, w: 172, h: 146,
          pills: ["Teachers", "Small government", "Endangered languages"],
          about: [
            "A government, a community or a user group forks Alpha and tunes it for its own setting.",
            "They start from a working system, not from scratch."
          ]
        },
        {
          id: "pilot", title: "Pilot", sub: ["Co-build with users"], frac: 0.56,
          about: ["Each custom Alpha is built with the people who will use it, in a real setting."]
        },
        {
          id: "feedback", title: "Feed back", sub: ["Tools to Alpha + Map"], frac: 0.82,
          about: ["What a pilot builds flows back. New tools land in Alpha, and new gaps land on the Map."]
        }
      ],
      extras: [
        {
          kind: "dotted", from: "feedback", to: "showcase", off1: [-30, 0], off2: [-45, 0],
          legend: "Tools land back in Alpha",
          about: "A tool built for one fork can land straight back in Alpha for everyone."
        }
      ]
    },
    {
      id: "compute",
      tab: "Compute",
      title: "Compute flywheel",
      tagline: "Compute for the commons",
      legend: "Compute flywheel",
      attach: { from: "showcase", to: "invite" },
      bulge: 345,
      label: { lines: ["Compute for", "the commons"], at: [330, 637] },
      about: [
        "Funders follow gaps. Compute follows demand.",
        "What lands in Alpha creates demand for compute. What works scales to real users. Verified use-cases and stories show compute donors what their capacity made possible, so they add more. That capacity flows back to builders, and straight into the big builds.",
        "Donated compute usually looks like R&D support: pilots, evaluations and training runs. Scaling to millions of users needs revenue, which belongs to a separate business flywheel, not shown here."
      ],
      nodes: [
        {
          id: "deploy", title: "Deploy", sub: ["Scale to real users"], frac: 0.2, w: 170,
          about: [
            "What works in the Showcase moves into real deployments: pilots, programs and services that people rely on.",
            "Donated compute can carry a deployment a long way, though not to millions of users."
          ]
        },
        {
          id: "prove", title: "Prove", sub: ["Verified use-cases", "& stories for donors"], frac: 0.44, w: 190, h: 72,
          about: [
            "Every deployment produces evidence a donor can check: what their compute served, for whom, and what changed.",
            "A showcase says what is possible. A verified use-case says what happened."
          ]
        },
        {
          id: "pledge", title: "Pledge", sub: ["Compute donors add capacity"], frac: 0.79, w: 200,
          about: [
            "With proof in hand, compute donors renew and grow what they give.",
            "That capacity reaches builders through Invite, and the big builds directly."
          ]
        }
      ],
      extras: [
        {
          kind: "solid", from: "pledge", to: "build", off1: [-30, 0],
          about: "Some donated capacity goes straight into a big build, such as a training run."
        },
        {
          kind: "curve", from: "invite", to: "showcase", bend: -20, off1: [-55, -12], off2: [45, 18],
          about: "Builders funded with donated compute land their work in Alpha."
        }
      ]
    }
  ]
};
