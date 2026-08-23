import type { PublicSiteManifest, PublicSiteSection } from "../types";

const assetBase = "https://timbermillconstruction.ie/wp-content/uploads";
const logo = `${assetBase}/2020/07/logo-timberpng.png`;

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us/" },
  { label: "Services", href: "/services-dublin/" },
  { label: "Projects", href: "/projects/" },
  { label: "Contact Us", href: "/contact-us/" },
];

const serviceLinks = [
  { label: "House Builders", href: "/house-builders-dublin/" },
  { label: "House Extensions", href: "/house-extensions-dublin/" },
  { label: "House Renovation", href: "/house-renovations-dublin/" },
  { label: "Attic Conversions", href: "/attic-conversion-dublin/" },
  { label: "Passive Houses", href: "/passive-house-dublin/" },
  { label: "Roof Repair", href: "/roofing-2-2/" },
];

const callbackFields = [
  { id: "name", label: "Name", placeholder: "Your Name*" },
  { id: "phone", label: "Phone", placeholder: "Your Phone*", type: "tel" },
];

const testimonials = [
  {
    quote:
      "Dave Dunne and Timbermill Construction carry out building works, commercial or domestic. They remain our default go to people for any future building needs.",
    name: "Mitchell Bohan",
  },
  {
    quote:
      "We used Timbermill to construct a complex house extension. We were completely delighted with the end result and recommend them for any building projects.",
    name: "Dan & Louise",
  },
  {
    quote:
      "Dave and his team were reliable and clean, and the work done in our home was completed to a high standard.",
    name: "Danny Towel",
  },
];

const quoteCta = {
  component: "public.cta.band",
  props: {
    title:
      "We’re here to help you get started in the right direction with your building project",
    href: "/contact-us/",
    label: "Get A Quote",
  },
} satisfies PublicSiteSection;

function nav(): PublicSiteSection {
  return {
    component: "public.navigation.standard",
    props: {
      business_name: "Timbermill Construction",
      logo_url: logo,
      home_href: "/",
      phone: "+353 83 473 2201",
      email: "info@timbermillconstruction.ie",
      social_label: "f",
      links: navLinks,
      service_links: serviceLinks,
    },
  };
}

function hero(
  headline: string,
  subheadline: string,
  image_url: string,
  cta = true,
): PublicSiteSection {
  return {
    component: "public.hero.image",
    props: {
      layout: "center_overlay",
      headline,
      subheadline,
      image_url,
      href: cta ? "/contact-us/" : undefined,
      cta_label: "Request a Quote",
    },
  };
}

function callback(): PublicSiteSection {
  return {
    component: "public.form.callback_bar",
    props: {
      form_id: "timbermill-callback",
      title: "Request A Call Back",
      fields: callbackFields,
      submit_label: "Send Request",
    },
  };
}

function intro(
  eyebrow: string,
  title: string,
  paragraphs: string[],
): PublicSiteSection {
  return {
    component: "public.content.intro",
    props: { eyebrow, title, paragraphs },
  };
}

function testimonialsSection(): PublicSiteSection {
  return {
    component: "public.proof.testimonials",
    props: {
      title: "What our customers are saying about us",
      items: testimonials,
    },
  };
}

function contactForm(): PublicSiteSection {
  return {
    component: "public.form.lead",
    props: {
      form_id: "timbermill-contact",
      title: "Contact Us",
      privacy_notice:
        "To find out how we can help you to transform your home, contact us today. We’re here to answer questions and arrange a convenient time to discuss your plans.",
      fields: [
        { id: "name", label: "Your Name", placeholder: "Your Name*" },
        {
          id: "email_phone",
          label: "Your Email/Phone",
          placeholder: "Your Email/Phone*",
        },
        {
          id: "message",
          label: "Your Message",
          placeholder: "Your Message*",
          type: "textarea",
        },
      ],
      submit_label: "Submit",
    },
  };
}

function footer(): PublicSiteSection {
  return {
    component: "public.footer.standard",
    props: {
      business_name: "Timbermill Construction",
      logo_url: logo,
      links: navLinks,
      service_links: serviceLinks,
      hours: "Mon - Fri: 8.00am 6.00pm",
      address: "Clonfert, Maynooth, Co. Kildare, Ireland",
      phone: "(+353) 83 473 2201",
      email: "info@timbermillconstruction.ie",
      badges: [
        {
          image_url: `${assetBase}/2020/07/IMG_4287.jpg`,
          alt_text: "CIRI accreditation",
        },
        {
          image_url: `${assetBase}/2020/07/logo4.jpg`,
          alt_text: "Certified Passive House Consultant",
        },
        {
          image_url: `${assetBase}/2020/07/logo3.jpg`,
          alt_text: "SEAI registration",
        },
        {
          image_url: `${assetBase}/2020/07/logo2.jpg`,
          alt_text: "Construction accreditation",
        },
      ],
      copyright:
        "© 2026 Timbermill Construction. All rights reserved | Dublin Web Design by Aspire Media.",
    },
  };
}

function serviceCards(): PublicSiteSection {
  return {
    component: "public.services.grid",
    props: {
      title: "We can service all of your construction needs",
      services: [
        {
          name: "House Build",
          description: "Consultation design, planning and implementation",
          href: "/house-builders-dublin/",
          icon_url: `${assetBase}/house-build.png`,
        },
        {
          name: "Extensions",
          description: "Single or multi-storey",
          href: "/house-extensions-dublin/",
          icon_url: `${assetBase}/extension.png`,
        },
        {
          name: "Renovations",
          description: "Refreshing your property for optimum space",
          href: "/house-renovations-dublin/",
          icon_url: `${assetBase}/renovation.png`,
        },
        {
          name: "Passive House",
          description:
            "The complete set of services that will bring your passive house project to life",
          href: "/passive-house-dublin/",
          icon_url: `${assetBase}/passive-house.png`,
        },
        {
          name: "Attic Conversions",
          description: "Attic conversions",
          href: "/attic-conversion-dublin/",
          icon_url: `${assetBase}/attic-convensions.png`,
        },
        {
          name: "Roofing",
          description: "All roof, repairs, new roofs and re-roofing",
          href: "/roofing-2-2/",
          icon_url: `${assetBase}/roofing.png`,
        },
      ],
    },
  };
}

function serviceDetail({
  path,
  title,
  headline,
  subheadline,
  heroImage,
  introTitle,
  introCopy,
  splitImage,
  featuresTitle,
  features,
}: {
  path: string;
  title: string;
  headline: string;
  subheadline: string;
  heroImage: string;
  introTitle: string;
  introCopy: string[];
  splitImage?: string;
  featuresTitle: string;
  features: { title: string; body: string }[];
}) {
  return {
    path,
    title,
    sections: [
      nav(),
      hero(headline, subheadline, heroImage),
      callback(),
      {
        component: "public.content.split",
        props: {
          eyebrow: "Dublin Builders You Can Trust",
          title: introTitle,
          paragraphs: introCopy,
          image_url: splitImage,
        },
      },
      {
        component: "public.content.feature_grid",
        props: {
          eyebrow: "Our Services",
          title: featuresTitle,
          items: features,
        },
      },
      quoteCta,
      {
        component: "public.faq.accordion",
        props: {
          title: `${headline} - Frequently Asked Questions`,
          items: [
            {
              question: "Will Timbermill Construction visit before quoting?",
              answer:
                "Yes. The team discusses the project, scope, timelines, and next steps before work begins.",
            },
            {
              question: "Do you cover Dublin and surrounding areas?",
              answer:
                "Yes. Timbermill works across Dublin, Kildare, Meath, Naas, Maynooth, and nearby areas.",
            },
            {
              question: "How do I start?",
              answer:
                "Send a quote request or call the team to arrange a consultation.",
            },
          ],
        },
      },
      testimonialsSection(),
      contactForm(),
      footer(),
    ],
  };
}

export const timbermillConstructionManifest = {
  manifest_version: "2026-06-26",
  title: "Timbermill Construction",
  theme: {
    preset: "timbermill_classic",
    primary: "#b9ad7b",
    accent: "#ff5a14",
    background: "#ffffff",
    text: "#586653",
    muted: "#6f756b",
    border: "#e8e4d8",
    radius: "999px",
    density: "spacious",
  },
  seo: {
    description:
      "Timbermill Construction provides house builds, extensions, renovations, passive house, attic conversion, and roofing services around Dublin.",
  },
  pages: [
    {
      path: "/",
      title: "Professional Builders Dublin | Construction Builders in Dublin",
      sections: [
        nav(),
        hero(
          "Professional & Reliable Builders Dublin",
          "We undertake all aspects of work from design and build renovations to extensions and much more.",
          `${assetBase}/2020/07/bridge-under-the-blue-sky-3566187.jpg`,
        ),
        callback(),
        intro(
          "Dublin Builders You Can Trust",
          "We are expert builders spanning Dublin, Kildare, Meath, Maynooth",
          [
            "Our utmost priority is to provide building and construction work at the highest level of expertise. If you want to improve your home and bring it to a new level, we are ready to hear your requirements.",
          ],
        ),
        intro(
          "Our Services",
          "Transform your home with our first-class array of building services in Dublin",
          [
            "All our work is to the highest standard, complete with all building regulations, and delivered at a competitive price.",
          ],
        ),
        quoteCta,
        {
          component: "public.gallery.grid",
          props: {
            title:
              "View our building projects below, then get in touch with us",
            items: [
              {
                title: "Renovation project",
                image_url: `${assetBase}/2020/07/project-1-550x550.jpg`,
                caption: "Timbermill renovation project",
              },
              {
                title: "Indoor construction",
                image_url: `${assetBase}/2020/07/The-indoor-550x550.jpg`,
                caption: "Interior project work",
              },
              {
                title: "Passive standard home",
                image_url: `${assetBase}/2020/07/project-2.jpg`,
                caption: "New-build project",
              },
            ],
          },
        },
        serviceCards(),
        testimonialsSection(),
        contactForm(),
        footer(),
      ],
    },
    {
      path: "/about-us/",
      title: "About Us - Timbermill Construction",
      sections: [
        nav(),
        hero(
          "About Us",
          "Timbermill Construction builds your dreams",
          `${assetBase}/New-house-build-for-family-in-Dublin-1.jpg`,
          false,
        ),
        callback(),
        {
          component: "public.content.split",
          props: {
            eyebrow: "It all begins with you",
            title: "Understanding our clients",
            paragraphs: [
              "Our clients are typically families living in Kildare, Meath, Naas, Maynooth, and other areas of Dublin, with the need for an improved quality of living and space.",
              "Out of this comes respect for our team and business.",
            ],
            image_url: `${assetBase}/Dublin-Family.jpg`,
          },
        },
        {
          component: "public.content.split",
          props: {
            eyebrow: "It continues with",
            title: "Our company",
            paragraphs: [
              "Timbermill Construction was founded by David Dunne in January 2017. David’s background is in carpentry, having qualified in 2008, and he is an internationally recognized passive house consultant.",
              "We build our clients’ dreams by listening to and understanding their needs, ensuring we are on the same page before work begins.",
            ],
            image_url: `${assetBase}/David-Dunne.jpg`,
            image_position: "left",
          },
        },
        quoteCta,
        {
          component: "public.content.split",
          props: {
            eyebrow: "And it comes to life with",
            title: "Our team",
            paragraphs: [
              "A team of experts brings the construction plan to life on site with practical coordination and careful workmanship.",
            ],
            image_url: `${assetBase}/Team-of-Experts.jpg`,
          },
        },
        testimonialsSection(),
        contactForm(),
        footer(),
      ],
    },
    {
      path: "/services-dublin/",
      title:
        "Timbermill Construction - Building services from the best Builders in Dublin",
      sections: [
        nav(),
        hero(
          "Our Services",
          "Timbermill Construction builds your dreams",
          `${assetBase}/Our-Services.jpg`,
          false,
        ),
        callback(),
        intro(
          "Our Services",
          "Excellent Extensions & Renovations on time and in budget",
          [
            "At Timbermill Construction we offer a complete domestic construction service, whether it is building your new house, extending your existing house or renovating your existing house. We work with you and your architect to make your dream home into a reality.",
          ],
        ),
        serviceCards(),
        quoteCta,
        testimonialsSection(),
        contactForm(),
        footer(),
      ],
    },
    {
      path: "/projects/",
      title: "Projects Dublin - Timbermill Construction",
      sections: [
        nav(),
        hero(
          "Projects",
          "Timbermill Construction builds your dreams",
          `${assetBase}/Builders-Dublin-Projects.jpg`,
          false,
        ),
        callback(),
        {
          component: "public.gallery.grid",
          props: {
            title:
              "Completed projects designed and constructed by Timbermill Construction",
            items: [
              {
                title: "Extension in Straffan",
                image_url: `${assetBase}/project.jpg`,
                caption:
                  "A roof light and heightened ceiling created a brighter extension.",
              },
              {
                title: "Extension and Renovation in Straffan Co. Kildare",
                image_url: `${assetBase}/project-2.jpg`,
                caption:
                  "New windows, handcrafted kitchen, and garden patio views.",
              },
              {
                title: "New passive standard home in Co. Meath",
                image_url: `${assetBase}/repair-work-2.jpg`,
                caption:
                  "Built using a clay block system to exceed passive house standards.",
              },
            ],
          },
        },
        quoteCta,
        testimonialsSection(),
        contactForm(),
        footer(),
      ],
    },
    {
      path: "/contact-us/",
      title: "Contact Timbermill Construction for Building project in Dublin",
      sections: [
        nav(),
        hero(
          "Contact Us",
          "Timbermill Construction builds your dreams",
          `${assetBase}/Contact-Timbermill-Construction-1.jpg`,
          false,
        ),
        {
          component: "public.content.split",
          props: {
            eyebrow: "We build things differently",
            title: "Schedule an estimate. Let’s work together",
            paragraphs: [
              "Timbermill Construction is a full service construction company offering building solutions from start to finish.",
              "We have been working for our clients around Dublin and surrounding counties for years.",
            ],
            image_url: `${assetBase}/David-Dunne.jpg`,
          },
        },
        contactForm(),
        footer(),
      ],
    },
    serviceDetail({
      path: "/house-extensions-dublin/",
      title: "House Extensions Dublin - Timbermill Construction",
      headline: "House Extension Dublin",
      subheadline:
        "The perfect mix of energy-efficiency and comfortable living.",
      heroImage: `${assetBase}/house-extension-dublin.jpg`,
      introTitle: "One-stop solution for your House Extensions",
      introCopy: [
        "We have a professional team of extension building specialists in Dublin, qualified and experienced tradesmen that will complete your project from start to finish.",
        "Our extensions offer comfort and the perfect balance of affordability and quality.",
      ],
      splitImage: `${assetBase}/2020/07/House-Extension-Services-1.jpg`,
      featuresTitle: "What type of house extensions build is right for you?",
      features: [
        {
          title: "Single Storey Extension",
          body: "A cost-effective way of gaining more space and natural light.",
        },
        {
          title: "Double Storey Extension",
          body: "Create more space and often spend less per square metre.",
        },
        {
          title: "Garage Conversion",
          body: "Create extra living space without losing garden space.",
        },
      ],
    }),
    serviceDetail({
      path: "/house-renovations-dublin/",
      title: "House Renovation Dublin - Timbermill Construction",
      headline: "House Renovations Dublin",
      subheadline:
        "The perfect mix of renovation planning and high-quality delivery.",
      heroImage: `${assetBase}/House-Renovation-Dublin.jpg`,
      introTitle: "Home Renovations In Dublin",
      introCopy: [
        "The Timbermill team possesses the qualities and relevant experience needed to cover all aspects of high class renovations in Dublin.",
        "Our attention and abilities to make smart decisions are focused around your project.",
      ],
      splitImage: `${assetBase}/Home-Renovation-Dublin.jpg`,
      featuresTitle: "House Renovation Services",
      features: [
        {
          title: "Bedroom Renovations",
          body: "Remodelling, paintwork, lighting, and careful finishes.",
        },
        {
          title: "Kitchen Renovations",
          body: "Beautifully crafted kitchen spaces with sleek finishes.",
        },
        {
          title: "Bathroom Renovations",
          body: "Contemporary or traditional bathroom styling.",
        },
      ],
    }),
    serviceDetail({
      path: "/attic-conversion-dublin/",
      title: "Attic Conversion Dublin - Timbermill Construction",
      headline: "Attic Conversion Dublin",
      subheadline: "The perfect mix of extra space and practical planning.",
      heroImage: `${assetBase}/Attic-Conversion-Dublin.jpg`,
      introTitle:
        "Get To Know Our Outstanding Attic Conversion Services in Dublin",
      introCopy: [
        "Timbermill Construction is the industry leader for attic conversions in Dublin and surrounding areas.",
        "Whether it is a spare bedroom or a quiet home office, there are many ways to transform attic space.",
      ],
      splitImage: `${assetBase}/2020/07/Attic-Conversion-Services-1.jpg`,
      featuresTitle: "Why Should You Choose Timbermill Construction?",
      features: [
        { title: "Expert advice", body: "Planning from start to finish." },
        {
          title: "Building regulations",
          body: "Attic specialists who follow strict building regulations.",
        },
        { title: "Quality workmanship", body: "A careful finish as standard." },
      ],
    }),
    serviceDetail({
      path: "/passive-house-dublin/",
      title: "Passive House Dublin - Timbermill Construction",
      headline: "Passive House Dublin",
      subheadline: "Comfortable, affordable, ecological living.",
      heroImage: `${assetBase}/2020/07/Passive-House-Consulting-1.jpg`,
      introTitle: "We build naturally healthy passive houses in Dublin",
      introCopy: [
        "Passive houses are energy-efficient, comfortable, affordable, and ecological.",
        "Timbermill can help bring passive house performance into a real home project.",
      ],
      featuresTitle: "Benefits of Building a Passive House",
      features: [
        {
          title: "Energy efficiency",
          body: "Reduce reliance on active heating and cooling sources.",
        },
        {
          title: "Comfort",
          body: "Maintain a comfortable internal temperature throughout the year.",
        },
        {
          title: "Certified consulting",
          body: "Work with certified passive house consultants.",
        },
      ],
    }),
    serviceDetail({
      path: "/house-builders-dublin/",
      title: "New Builds Dublin - Timbermill Construction",
      headline: "House Builders Dublin",
      subheadline: "The perfect mix of design, planning and implementation.",
      heroImage: `${assetBase}/house-builders-dublin.jpg`,
      introTitle: "We Are Expert House Builders Dublin",
      introCopy: [
        "Timbermill Construction has completed numerous new build projects across Dublin on all types of property.",
        "The project location, design quality, and relationship with the surrounding area all shape the final result.",
      ],
      featuresTitle: "House Build Services",
      features: [
        {
          title: "Planning",
          body: "Drawings and technical information for local authorities.",
        },
        {
          title: "Design",
          body: "Design matched to the plot, location, and surrounding area.",
        },
        {
          title: "Implementation",
          body: "A practical build team to bring the project through construction.",
        },
      ],
    }),
    serviceDetail({
      path: "/roofing-2-2/",
      title: "Dublin Roof Repair - Timbermill Construction",
      headline: "Dublin Roof Repair",
      subheadline: "Your trusted industry experts in roofing.",
      heroImage: `${assetBase}/2020/07/Passive-House-Consulting-1.jpg`,
      introTitle: "Dublin Roof Repair Service",
      introCopy: [
        "Timbermill Construction offers professional residential and commercial roofing services around Dublin and surrounding areas.",
        "The team can take on roof repair or replacement projects and protect your home for years to come.",
      ],
      featuresTitle:
        "Benefits of Dublin roofing services by Timbermill Construction",
      features: [
        { title: "Re-roofing", body: "Replace and improve roof systems." },
        {
          title: "Roof installation",
          body: "Install new roofing as part of a build or upgrade.",
        },
        {
          title: "Roof repairs",
          body: "Resolve leaks and prevent small issues becoming larger problems.",
        },
      ],
    }),
  ],
} satisfies PublicSiteManifest;
