async function loadPublications() {

    const publishedContainer =
        document.getElementById("published-list");

    const preprintContainer =
        document.getElementById("preprint-list");

    const thesisContainer =
        document.getElementById("thesis-list");


    try {

        /* =====================================================
           Load BibTeX file
        ===================================================== */

        const response = await fetch(
            "assets/bib/publications.bib"
        );

        if (!response.ok) {

            throw new Error(
                "Could not load publications.bib: "
                + response.status
            );

        }


        const bibtex =
            await response.text();



        /* =====================================================
           Check parser
        ===================================================== */

        if (
            typeof bibtexParse === "undefined"
        ) {

            throw new Error(
                "BibTeX parser did not load."
            );

        }



        /* =====================================================
           Parse BibTeX
        ===================================================== */

        const rawEntries =
            bibtexParse.toJSON(
                bibtex
            );



        /* =====================================================
           Normalize BibTeX fields
        ===================================================== */

        const entries =
            rawEntries.map(
                function (entry) {

                    const normalizedTags =
                        {};


                    for (
                        const [key, value]
                        of Object.entries(
                            entry.entryTags || {}
                        )
                    ) {

                        normalizedTags[
                            key.toLowerCase()
                        ] = value;

                    }


                    return {

                        citationKey:
                            entry.citationKey || "",

                        entryType:
                            normalizeEntryType(
                                entry.entryType || ""
                            ),

                        tags:
                            normalizedTags

                    };

                }
            );



        /* =====================================================
           Sort newest to oldest

           Optional BibTeX field:

               order = {3}
               order = {2}
               order = {1}

           Higher order appears first for entries
           having the same year.
        ===================================================== */

        entries.sort(
            function (a, b) {

                const yearA =
                    parseInt(
                        a.tags.year || "0",
                        10
                    );

                const yearB =
                    parseInt(
                        b.tags.year || "0",
                        10
                    );


                if (
                    yearA !== yearB
                ) {

                    return yearB - yearA;

                }


                const orderA =
                    parseInt(
                        a.tags.order || "0",
                        10
                    );

                const orderB =
                    parseInt(
                        b.tags.order || "0",
                        10
                    );


                return orderB - orderA;

            }
        );



        /* =====================================================
           Separate categories
        ===================================================== */

        const published = [];
        const preprints = [];
        const theses = [];


        entries.forEach(
            function (entry) {

                const tags =
                    entry.tags;


                const category =
                    determineCategory(
                        tags,
                        entry.entryType
                    );


                const html =
                    formatPublication(
                        tags,
                        entry.entryType,
                        category
                    );


                if (
                    category === "preprint"
                ) {

                    preprints.push(
                        html
                    );

                }

                else if (
                    category === "thesis"
                ) {

                    theses.push(
                        html
                    );

                }

                else {

                    published.push(
                        html
                    );

                }

            }
        );



        /* =====================================================
           Display all categories
        ===================================================== */

        displayPublications(
            publishedContainer,
            published,
            "No publications currently listed."
        );


        displayPublications(
            preprintContainer,
            preprints,
            "No preprints or working papers currently listed."
        );


        displayPublications(
            thesisContainer,
            theses,
            "No theses currently listed."
        );

    }


    catch (error) {

        console.error(
            "Publication loading error:",
            error
        );


        if (
            publishedContainer
        ) {

            publishedContainer.innerHTML =
                "<li>Unable to load publications.</li>";

        }


        if (
            preprintContainer
        ) {

            preprintContainer.innerHTML =
                "<li>Unable to load preprints and working papers.</li>";

        }


        if (
            thesisContainer
        ) {

            thesisContainer.innerHTML =
                "<li>Unable to load theses.</li>";

        }

    }

}



/* =========================================================
   Normalize BibTeX entry type
========================================================= */

function normalizeEntryType(
    entryType
) {

    return String(
        entryType || ""
    )
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[_-]/g, "")
        .trim();

}



/* =========================================================
   Determine publication category
========================================================= */

function determineCategory(
    tags,
    entryType
) {

    let category =
        String(
            tags.category || ""
        )
            .toLowerCase()
            .trim();


    /* -----------------------------------------------------
       Normalize category spelling
    ----------------------------------------------------- */

    const normalizedCategory =
        category
            .replace(/[’']/g, "")
            .replace(/[_-]/g, " ")
            .replace(/\s+/g, " ")
            .trim();



    /* -----------------------------------------------------
       Thesis / dissertation
    ----------------------------------------------------- */

    if (
        isThesisEntry(
            entryType,
            normalizedCategory
        )
    ) {

        return "thesis";

    }



    /* -----------------------------------------------------
       Preprint / working paper
    ----------------------------------------------------- */

    if (
        normalizedCategory === "preprint" ||
        normalizedCategory === "working" ||
        normalizedCategory === "workingpaper" ||
        normalizedCategory === "working paper"
    ) {

        return "preprint";

    }



    /* -----------------------------------------------------
       Default
    ----------------------------------------------------- */

    return "published";

}



/* =========================================================
   Detect thesis entries
========================================================= */

function isThesisEntry(
    entryType,
    category
) {

    const normalizedType =
        normalizeEntryType(
            entryType
        );


    const normalizedCategory =
        String(
            category || ""
        )
            .toLowerCase()
            .replace(/[’']/g, "")
            .replace(/[_-]/g, " ")
            .replace(/\s+/g, " ")
            .trim();


    return (

        normalizedType ===
            "phdthesis" ||

        normalizedType ===
            "mastersthesis" ||

        normalizedType ===
            "masterthesis" ||

        normalizedCategory ===
            "thesis" ||

        normalizedCategory ===
            "dissertation" ||

        normalizedCategory ===
            "phd thesis" ||

        normalizedCategory ===
            "phd dissertation" ||

        normalizedCategory ===
            "doctoral dissertation" ||

        normalizedCategory ===
            "master thesis" ||

        normalizedCategory ===
            "masters thesis"

    );

}



/* =========================================================
   Determine thesis label
========================================================= */

function getThesisLabel(
    tags,
    entryType
) {

    const normalizedType =
        normalizeEntryType(
            entryType
        );


    const typeField =
        String(
            tags.type || ""
        )
            .toLowerCase()
            .replace(/[’']/g, "")
            .replace(/[_-]/g, " ")
            .replace(/\s+/g, " ")
            .trim();


    const categoryField =
        String(
            tags.category || ""
        )
            .toLowerCase()
            .replace(/[’']/g, "")
            .replace(/[_-]/g, " ")
            .replace(/\s+/g, " ")
            .trim();



    /* -----------------------------------------------------
       Master's thesis
    ----------------------------------------------------- */

    if (
        normalizedType ===
            "mastersthesis" ||

        normalizedType ===
            "masterthesis" ||

        typeField.includes(
            "master"
        ) ||

        categoryField.includes(
            "master"
        )
    ) {

        return "Master's Thesis";

    }



    /* -----------------------------------------------------
       Ph.D. dissertation
    ----------------------------------------------------- */

    if (
        normalizedType ===
            "phdthesis" ||

        typeField.includes(
            "phd"
        ) ||

        typeField.includes(
            "doctoral"
        ) ||

        categoryField.includes(
            "phd"
        ) ||

        categoryField.includes(
            "doctoral"
        ) ||

        categoryField ===
            "dissertation"
    ) {

        return "Ph.D. Dissertation";

    }



    /* -----------------------------------------------------
       Generic fallback
    ----------------------------------------------------- */

    return "Thesis";

}



/* =========================================================
   Format one publication
========================================================= */

function formatPublication(
    tags,
    entryType,
    category
) {

    let html =
        "";



    /* =====================================================
       Authors
    ===================================================== */

    if (
        tags.author
    ) {

        html +=
            formatAuthors(
                tags.author
            );


        html +=
            ". ";

    }



    /* =====================================================
       Title
    ===================================================== */

    if (
        tags.title
    ) {

        const title =
            cleanText(
                tags.title
            );


        if (
            category ===
                "thesis"
        ) {

            html +=
                `<em>${title}</em>. `;

        }

        else {

            html +=
                `“${title}.” `;

        }

    }



    /* =====================================================
       Journal article
    ===================================================== */

    if (
        tags.journal
    ) {

        html +=
            `<em>${cleanText(
                tags.journal
            )}</em>`;


        if (
            tags.volume
        ) {

            html +=
                ` ${cleanText(
                    tags.volume
                )}`;

        }


        if (
            tags.number
        ) {

            html +=
                `(${cleanText(
                    tags.number
                )})`;

        }


        if (
            tags.year
        ) {

            html +=
                ` (${cleanText(
                    tags.year
                )})`;

        }


        if (
            tags.pages
        ) {

            html +=
                `: ${cleanText(
                    tags.pages
                )}`;

        }


        html +=
            ". ";

    }



    /* =====================================================
       Proceedings / conference paper
    ===================================================== */

    else if (
        tags.booktitle
    ) {

        html +=
            `<em>${cleanText(
                tags.booktitle
            )}</em>`;


        if (
            tags.volume
        ) {

            html +=
                ` ${cleanText(
                    tags.volume
                )}`;

        }


        if (
            tags.year
        ) {

            html +=
                ` (${cleanText(
                    tags.year
                )})`;

        }


        if (
            tags.pages
        ) {

            html +=
                `: ${cleanText(
                    tags.pages
                )}`;

        }


        html +=
            ". ";

    }



    /* =====================================================
       Thesis / Dissertation
    ===================================================== */

    else if (
        category === "thesis"
    ) {

        const thesisLabel =
            getThesisLabel(
                tags,
                entryType
            );


        html +=
            `${thesisLabel}`;


        if (
            tags.school
        ) {

            html +=
                `, ${cleanText(
                    tags.school
                )}`;

        }


        if (
            tags.year
        ) {

            html +=
                `, ${cleanText(
                    tags.year
                )}`;

        }


        html +=
            ". ";

    }



    /* =====================================================
       Preprint / Working Paper
    ===================================================== */

    else if (
        tags.year
    ) {

        html +=
            `${cleanText(
                tags.year
            )}. `;

    }



    /* =====================================================
       Note / Status

       Comes before links.
    ===================================================== */

    if (
        tags.note
    ) {

        let note =
            cleanText(
                tags.note
            );


        if (
            !/[.!?]$/.test(
                note
            )
        ) {

            note +=
                ".";

        }


        html +=
            `<span class="pub-note">${note}</span> `;

    }



    /* =====================================================
       Links
    ===================================================== */

    let links =
        "";



    /* -----------------------------------------------------
       DOI
    ----------------------------------------------------- */

    if (
        tags.doi
    ) {

        const doi =
            cleanText(
                tags.doi
            );


        links += `
            <a class="pub-link"
               href="https://doi.org/${encodeURIComponent(doi)}"
               target="_blank"
               rel="noopener noreferrer">
                DOI
            </a>
        `;

    }



    /* -----------------------------------------------------
       arXiv
    ----------------------------------------------------- */

    if (
        tags.eprint
    ) {

        const eprint =
            cleanText(
                tags.eprint
            );


        links += `
            <a class="pub-link"
               href="https://arxiv.org/abs/${encodeURIComponent(eprint)}"
               target="_blank"
               rel="noopener noreferrer">
                arXiv
            </a>
        `;

    }



    /* -----------------------------------------------------
       Generic URL
    ----------------------------------------------------- */

    if (
        tags.url
    ) {

        let linkText =
            "Paper";


        if (
            category ===
                "thesis"
        ) {

            linkText =
                "Full Text";

        }

        else if (
            category ===
                "published"
        ) {

            linkText =
                "Journal";

        }


        links += `
            <a class="pub-link"
               href="${escapeAttribute(
                   cleanText(
                       tags.url
                   )
               )}"
               target="_blank"
               rel="noopener noreferrer">
                ${linkText}
            </a>
        `;

    }



    /* =====================================================
       Add links
    ===================================================== */

    if (
        links
    ) {

        html += `
            <span class="pub-links">
                ${links}
            </span>
        `;

    }


    return html;

}



/* =========================================================
   Format author names
========================================================= */

function formatAuthors(
    authorString
) {

    const authors =
        authorString.split(
            /\s+and\s+/i
        );


    const formatted =
        authors.map(
            function (author) {

                author =
                    author.trim();


                let displayName =
                    author;



                /* -------------------------------------------------
                   Convert:

                       Xie, Bowen

                   to:

                       Bowen Xie
                ------------------------------------------------- */

                if (
                    author.includes(",")
                ) {

                    const pieces =
                        author.split(",");


                    const last =
                        pieces[0]
                            .trim();


                    const first =
                        pieces
                            .slice(1)
                            .join(" ")
                            .trim();


                    displayName =
                        `${first} ${last}`;

                }


                displayName =
                    cleanText(
                        displayName
                    );



                /* -------------------------------------------------
                   Bold Bowen Xie
                ------------------------------------------------- */

                const normalized =
                    displayName
                        .toLowerCase()
                        .replace(/\./g, "")
                        .replace(/\s+/g, " ")
                        .trim();


                if (
                    normalized ===
                        "bowen xie" ||

                    normalized ===
                        "b xie"
                ) {

                    return (
                        `<strong>${displayName}</strong>`
                    );

                }


                return displayName;

            }
        );



    /* =====================================================
       One author
    ===================================================== */

    if (
        formatted.length === 1
    ) {

        return formatted[0];

    }



    /* =====================================================
       Two authors
    ===================================================== */

    if (
        formatted.length === 2
    ) {

        return (
            formatted[0]
            + " and "
            + formatted[1]
        );

    }



    /* =====================================================
       Three or more authors
    ===================================================== */

    return (

        formatted
            .slice(
                0,
                -1
            )
            .join(", ")

        + ", and "

        + formatted[
            formatted.length - 1
        ]

    );

}



/* =========================================================
   Clean BibTeX text
========================================================= */

function cleanText(
    text
) {

    if (
        !text
    ) {

        return "";

    }


    return String(
        text
    )

        /* Remove BibTeX braces */

        .replace(
            /[{}]/g,
            ""
        )

        /* Convert BibTeX dashes */

        .replace(
            /---/g,
            "—"
        )

        .replace(
            /--/g,
            "–"
        )

        /* Common LaTeX symbols */

        .replace(
            /\\&/g,
            "&"
        )

        .replace(
            /\\%/g,
            "%"
        )

        .replace(
            /\\_/g,
            "_"
        )

        /* Collapse whitespace */

        .replace(
            /\s+/g,
            " "
        )

        .trim();

}



/* =========================================================
   Escape URL attributes
========================================================= */

function escapeAttribute(
    text
) {

    return String(
        text
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        );

}



/* =========================================================
   Display publication list
========================================================= */

function displayPublications(
    container,
    publications,
    emptyMessage
) {

    if (
        !container
    ) {

        return;

    }


    if (
        publications.length === 0
    ) {

        container.innerHTML =
            `<li>${emptyMessage}</li>`;


        return;

    }


    container.innerHTML =
        publications
            .map(
                function (publication) {

                    return (
                        `<li>${publication}</li>`
                    );

                }
            )
            .join("");

}



/* =========================================================
   Start
========================================================= */

loadPublications();
