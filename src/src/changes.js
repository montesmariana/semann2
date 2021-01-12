function trackChange(variable, concFile){
 $("editVariables").on("change", `input[name='typeSelection-${variable}-${concFile}']`, () => {
     const variables = settings.concFiles[concFile].variables;
     variables.indexOf(variable) === -1 ? variables.push(variable) : _.pull(variables, variable);
 }); 
 d3.selectAll("btn-concFile")
    .classed("active", (d) => settings.concFiles[d].variables.indexOf(variable) !== -1)
}