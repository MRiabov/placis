import type { WebsiteManifest, WebsiteSection } from "../types";

import {
  assets,
  business,
  clientLogoItems,
  contactFields,
  footerLinks,
  leadershipItems,
  navLinks,
  projectCategoryItems,
  serviceItems,
  socialLinks,
} from "./institutional-data";

function nav(activeHref: string, mode = "overlay"): WebsiteSection {
  return {
    component: "public.top_menu.fixed_cta",
    props: {
      business_name: business.name,
      home_href: "/",
      logo_url: assets.logo,
      mode,
      links: navLinks.map((link) => ({
        ...link,
        active: link.href === activeHref,
      })),
    },
  };
}

function hero(
  headline: string,
  imageUrl: string,
  altText: string,
): WebsiteSection {
  return {
    component: "public.hero.overlay_title",
    props: {
      headline,
      image: {
        url: imageUrl,
        alt_text: altText,
      },
    },
  };
}

function footer(): WebsiteSection {
  return {
    component: "public.footer.centered_social_nav",
    props: {
      business_name: business.name,
      social_links: socialLinks,
      links: footerLinks,
      copyright: "©2017 Harper Construction Company, Inc. All Rights Reserved",
    },
  };
}

export const harperConstructionManifest = {
  manifest_version: "2026-07-02",
  title: "Harper Construction",
  theme: {
    preset: "institutional_mono",
    primary: "#1f1f1f",
    neutral: "gray",
    accent: "#1f1f1f",
    background: "#ffffff",
    text: "#1f1f1f",
    muted: "#60646c",
    border: "#e0e0e0",
    radius: "0px",
    density: "spacious",
  },
  seo: {
    description:
      "Source-backed Harper Construction multipage reference fixture for website component reconstruction.",
  },
  pages: [
    {
      path: "/",
      title: "Harper Construction | Building Together",
      sections: [
        nav("/"),
        hero(
          "Building together",
          assets.homeHero,
          "Large aviation construction project at dusk",
        ),
        {
          component: "public.content.split",
          props: {
            anchor_id: "about",
            title:
              "Harper Construction Company, has a proud tradition of service as a General Contractor since 1974",
            paragraphs: [
              "Harper Construction Company, headquartered in San Diego, proudly celebrates 50 years of excellence in the construction industry. With a robust legacy of local and national experience, we have earned a reputation for delivering large and unique design-build projects ahead of schedule and on budget. Over half a century, we have consistently served clients and building owners with dedication and expertise. Our approach to every project is rooted in understanding the Owner's needs and expectations and then exceeding them, a commitment that has been the cornerstone of our success for five remarkable decades.",
            ],
            href: "/about",
            link_label: "Read our story.",
          },
        },
        {
          component: "public.content.intro",
          props: {
            anchor_id: "services",
            title: "We Offer a Wide Range of Services",
            paragraphs: [
              "From conception to completion, our entire team of estimators, designers, project managers and experienced executives make our clients' needs a priority. We have experience in a wide variety of projects and delivery methods, and use both time-proven practices and cutting-edge techniques to make sure our customers' projects meet their maximum potential.",
            ],
            href: "/services",
            link_label: "Learn More",
          },
        },
        {
          component: "public.gallery.grid",
          props: {
            anchor_id: "work",
            layout: "packed",
            show_labels: false,
            items: [
              {
                title: "Aviation project",
                image_url: assets.homeAbout,
                alt_text: "Aviation construction project",
              },
              {
                title: "Campus project",
                image_url: assets.homeGallery1,
                alt_text: "Campus construction project",
              },
              {
                title: "Public facility project",
                image_url: assets.homeGallery2,
                alt_text: "Public facility construction project",
              },
              {
                title: "Interior construction",
                image_url: assets.homeGallery3,
                alt_text: "Interior construction progress",
              },
              {
                title: "Education project",
                image_url: assets.homeGallery4,
                alt_text: "Education construction project",
              },
            ],
          },
        },
        {
          component: "public.content.intro",
          props: {
            anchor_id: "projects",
            title: "We Take Pride In The Projects We've Done",
            paragraphs: [
              "While our clients' satisfaction is our primary metric for excellence, we have also been recognized with numerous awards over the years for safety, business practices, and design excellence. We are proud to be at the forefront of green building practices, with dozens of LEED-certified projects, many achieving silver, gold and even platinum LEED certification. We understand that projects represent not only buildings, but the plans for the future of our clients",
            ],
            href: "/projects",
            link_label: "See Our Latest Projects",
          },
        },
        {
          component: "public.cta.band",
          props: {
            anchor_id: "contact",
            title: "Contact Us",
            body: "We'd love to discuss your upcoming project!",
            href: "/contact",
            label: "Get In Touch",
          },
        },
        footer(),
      ],
    },
    {
      path: "/about",
      title: "About Harper Construction",
      sections: [
        nav("/about"),
        hero(
          "A history of excellence",
          assets.aboutHero,
          "Construction team in the field",
        ),
        {
          component: "public.content.story_text",
          props: {
            anchor_id: "our-story",
            title: "Our Story",
            blocks: [
              {
                heading:
                  "Harper Construction Celebrates 50 Golden Years of Building Excellence!",
                paragraphs: [
                  "For half a century, Harper Construction has been a cornerstone of innovation and quality in the construction industry. Founded in 1974 by visionary leader Ron Harper, the company has flourished under the guidance of current Owner and President, Jeff Harper.",
                ],
              },
              {
                heading: "A Legacy Built on Teamwork and Dedication",
                paragraphs: [
                  "Our continued success is a testament to the unwavering commitment of our incredible team. We are proud to boast an enduring core of executive management, senior leaders, and passionate professionals who have dedicated over four decades to building something truly special.",
                ],
              },
              {
                heading: "A Culture of Stability and Tenure",
                paragraphs: [
                  "Harper Construction fosters a work environment that values stability and long-term commitment. This is reflected in the impressive tenure of our team members. This level of experience and continuity is valuable to our company and the homeowners we work with.",
                ],
              },
            ],
          },
        },
        {
          component: "public.content.story_text",
          props: {
            anchor_id: "experience",
            image_url: assets.aboutHistory,
            alt_text: "Historic construction company team",
            image_position: "left",
            blocks: [
              {
                heading: "Experience You Can Trust, Delivered on Every Project",
                paragraphs: [
                  "At Harper Construction, we understand that your project is more than just bricks and mortar. It's a vision, an investment, and a reflection of your dreams. That's why we place the most experienced construction professionals at the helm of every project we undertake.",
                  "We're not just building structures, we're building trust. For 50 years, we've consistently delivered the best value in building services, and we're here to continue that legacy for you.",
                ],
              },
              {
                heading: "Join us in celebrating this momentous occasion!",
                paragraphs: [
                  "We're incredibly grateful for the opportunity to serve our community for the past 50 years. We look forward to continuing to build a brighter future, together.",
                ],
              },
            ],
          },
        },
        {
          component: "public.content.leadership_grid",
          props: {
            anchor_id: "leadership",
            title: "Leadership",
            items: leadershipItems,
          },
        },
        {
          component: "public.content.logo_strip",
          props: {
            anchor_id: "clients",
            layout: "grid",
            title: "Our Valued Clients",
            intro:
              "Harper has always embraced our clients and partners as part of Our Team. Every project is performed with open communication. The partnering methodology is implemented and a mutual respect with our clients provides the groundwork for our success.",
            items: clientLogoItems,
          },
        },
        footer(),
      ],
    },
    {
      path: "/services",
      title: "Services | Harper Construction",
      sections: [
        nav("/services"),
        hero(
          "Services to Fit Your Needs",
          assets.servicesHero,
          "Large education construction project",
        ),
        {
          component: "public.content.intro",
          props: {
            anchor_id: "services-overview",
            title: "Our Services",
            paragraphs: [
              "Our company offers a variety of services to meet your project's needs, to take you from collaboration meetings all the way to ribbon-cutting and beyond. We believe that every project is unique, and can customize our approach to fit your particular project. While we are at the forefront of and specialize in design-build, we are very familiar with a number of delivery methods and are confident we can find the process that will best help you meet your goals.",
            ],
          },
        },
        {
          component: "public.gallery.grid",
          props: {
            anchor_id: "capabilities",
            layout: "packed",
            show_labels: true,
            items: serviceItems,
          },
        },
        footer(),
      ],
    },
    {
      path: "/projects",
      title: "Projects | Harper Construction",
      sections: [
        nav("/projects"),
        hero(
          "We Take Pride In Our Projects",
          assets.projectsHero,
          "Large construction project exterior",
        ),
        {
          component: "public.content.intro",
          props: {
            anchor_id: "overview",
            title: "Projects",
            paragraphs: [
              "Delivering projects that fulfill and exceed the owners expectations is a process that starts during the conceptual stage with a collaborative team from design through construction. This integrated team approach puts the focus of all team members specifically towards the culmination of the completed project. Check out our projects by clicking on the categories below.",
            ],
          },
        },
        {
          component: "public.gallery.grid",
          props: {
            anchor_id: "project-categories",
            layout: "packed",
            show_labels: true,
            items: projectCategoryItems,
          },
        },
        footer(),
      ],
    },
    {
      path: "/contact",
      title: "Contact Harper Construction",
      sections: [
        nav("/contact"),
        hero(
          "How Can We Help?",
          assets.contactHero,
          "Construction project exterior",
        ),
        {
          component: "public.contact.form_location",
          props: {
            anchor_id: "details",
            form_id: "institutional-contact",
            title: "Contact",
            body: "Please feel free to call us to discuss your upcoming project. For inquiries about employment, subcontracting for us, or information about our current project, please use the form below so we can connect you to the best person to help you.",
            business_name: "Harper Construction Company, Inc.",
            marketing_phone: business.marketing_phone,
            email: business.email,
            address: business.address,
            license_number: business.license,
            map_title: "San Diego office map",
            show_form: false,
            submit_label: "Submit",
            submit_action: "create_lead",
            fields: contactFields,
            privacy_notice:
              "Contact details are used only to respond to your Harper Construction enquiry.",
          },
        },
        footer(),
      ],
    },
  ],
} satisfies WebsiteManifest;
