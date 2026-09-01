package docnames

import "strings"

// SectionAfter returns the markdown body after ## title until the next ##.
func SectionAfter(text, title string) (string, bool) {
	return sectionAfterPrefix(text, "## "+title+"\n", "\n## ")
}

// H3After returns the markdown body after ### title until the next ## or ###.
func H3After(text, title string) (string, bool) {
	return sectionAfterPrefix(text, "### "+title+"\n", "\n##")
}

func sectionAfterPrefix(text, heading, nextNeedle string) (string, bool) {
	needle := "\n" + heading
	idx := strings.Index(text, needle)
	if idx < 0 {
		if strings.HasPrefix(text, heading) {
			idx = 0
			needle = heading
		} else {
			return "", false
		}
	}
	rest := text[idx+len(needle):]
	if next := strings.Index(rest, nextNeedle); next >= 0 {
		rest = rest[:next]
	}
	return rest, true
}

func addName(dst map[string]bool, name string) {
	if name == "" || dst[name] {
		return
	}
	dst[name] = true
}

func sortedKeys(m map[string]bool) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	return out
}
