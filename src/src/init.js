const variableTypes = [
    {
        name : "confidence",
        title : "Stars",
        description : "Star rating, e.g. to rate the confidence of your annotation.",
        img : "assets/confidence.png",
        instruction : "Click on the right star to rate "
    },
    {
        name : "cues",
        title : "Context word selection",
        description : "Clickable version of the concordance line, with each space-separated item as a button.",
        img : "assets/cues.png",
        instruction : "Click on context words for "
    },
    {
        name : "input",
        title : "Input text",
        description : "Open input box, e.g. to make a comment.",
        img : "assets/comments.png",
        instruction : "Fill in the box for "
    },
    {
        name : "numeric",
        title : "Numeric variable",
        description : "Numeric input box.",
        img : "assets/numeric.png",
        instruction : "Fill in a number for "
    },
    {
        name : "categorical",
        title : "Categorical variable",
        description : "Variable with discrete categories: buttons show the description and a code is loaded instead.",
        img : "assets/numeric.png",
        instruction : "Click on the right button to select the value of "
    }
]

let settings = {
    projectName : "AnnotationProject",
    variables : [],
    concFiles : [],
    annotation : {}
}

drawNavbar(settings);

d3.select("#loadSettings")
    .on("click", loadSettings);

d3.selectAll(".concLoader")
    .on("click", () => nameConcordance(openTSV(), settings));

d3.select("#nav-conc-tab")
    .on("click", () => {
        d3.select("#nav-conc").classed("show active", true);
        d3.select("#nav-conc-tab").classed("active", true);
        d3.selectAll(".varEdit").classed("active", false);
        d3.select("#editVariables").selectAll("div.tab-pane").classed("show active", false);
    });

d3.select("#newVariables")
    .on("click", () => {
        $("#newVariableModal").modal("show");
    });

d3.select("#newVariableBody")
    .selectAll("div.card")
    .data(variableTypes).enter()
    .append("div")
    .attr("class", "card")
    .each(fillCard);


d3.select("#saveModal").on("click", () => {
    listVariables(settings);
    $("#newVariableModal").modal("hide");
});

listVariables(settings);