// Main navigation bar
function drawNavbar(settings){
    d3.select("#navbarTop")
    .selectAll("li")
    .data([
        {code: "start", text:"Start"},
        {code: "settings", text:"Project settings"},
        {code: "workspace", text:"Workspace"},
        {code: "save", text:"Save"}
    ]).enter()
    .append("li")
    .attr("class", "nav-item")
    .append("a")
    .attr("class", "nav-link p-2")
    .classed("active", (d) => d.code === "start")
    .attr("id", (d) => d.code + "-tab")
    .attr("data-toggle", "tab")
    .attr("href", (d) => "#" + d.code)
    .attr("role", "tab")
    .attr("aria-controls", (d) => d.code)
    .attr("aria-selected", (d) => d.code === "start")
    .text((d) => d.text)
    .on("click", (d) => {
        const clicked = d.code;
        if (clicked === "save") {
            askSave(settings);
        } else {
            d3.select("#navbarTop").selectAll("a")
            .classed("active", (dd) => dd.code === clicked)
            .each((dd) => d3.select("#" + dd.code).classed("active", dd.code === clicked));
        }        
    });

}
// List of variables

function askSave(settings){
    Swal.fire({
        title: "What would you like to save?",
        input: 'select',
        inputOptions: {"settings" : "Settings", "conc" : "Annotation"},
        showCancelButton: true,
      }).then((result) => {
        if (result.value) {
            if (result.value === "settings"){
                saveSettings(settings);
            } else if (settings.concFiles.length > 1) {
                const types = settings.concFiles.map((d) => d.name);
                types.pull("all")
                Swal.fire({
                    title: "Which concordance would you like to export?",
                    input: 'select',
                    inputOptions: types,
                    showCancelButton: true,
                  }).then((result) => {
                    if (result.value === "all") {
                        exportConcordance(settings, types);
                    } else { 
                        const concFile = settings.concFiles.filter((d) => d.name === result.value)[0].name;
                        exportConcordance(settings, [concFile]);
                    }
                  });
            } else {
                exportConcordance(settings, [settings.concFiles[0].name]);
            }
        }  
      });
}


function exportConcordance(settings, types){
    saveTSV(createTSV(settings, types), settings.projectName);
}