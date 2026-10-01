export const functionLink = (id, version, library, section = "definition") =>
    `#/function/${id}/${version}/${section}${library ? `/library/${library}` : ""}`;
