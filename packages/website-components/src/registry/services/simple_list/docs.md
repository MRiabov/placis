# public.services.simple_list

## Purpose

Simple ruled service labels for sparse contractor sites that list capabilities
as text instead of rich image cards.

## Structure

The component renders a section heading and a responsive service list. Each item
can be plain text or a link and may include a short description when the source
site provides enough service copy.

## Use When

Use this for reference sites like Big Oaks Construction where the service
surface is intentionally minimal: a few high-level services separated by
horizontal rules, with no service thumbnails or long-form service blurbs.

## Content Notes

For generated tenant sites, selected services should usually come from
researched services or owner confirmation. Source-reference fallbacks can be
stored in blueprint default values with `mandatory_edit` metadata.
