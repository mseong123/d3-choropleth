const colorScheme=d3.schemePuBu[9];
const width=840; //width of container less left/right margin (used for legend only)
const leftRightMargin=30;
const topBottomMargin=10;
var topologyData;
var educationData;
var geoJsonData;

var svg=d3.select("#svg").append("g")
        .attr("transform","translate("+leftRightMargin+","+topBottomMargin+")")
        

var legend=d3.select("#svg-legend").append("g")
        .attr("id","legend")
        .attr("transform","translate("+((((width+leftRightMargin+leftRightMargin)-(colorScheme.length-1)*40)/2)+50)+",20)")

var legendText=d3.select("#svg-legend").append("g")
        .attr("transform","translate("+((((width+leftRightMargin+leftRightMargin)-(colorScheme.length-1)*40)/2)+50)+",45)")

//only 1 scale- color
var color=d3.scaleThreshold().range(colorScheme)
        
Promise.all([d3.json("https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json"),d3.json("https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json")]).then(
    data=>{
        topologyData=data[0];
        educationData=data[1]
        update(topologyData,educationData)
    }
)        

function update(data1,data2) {
    //scaleThreshold domain colorscheme calculation.
    const thresholdStep=d3.extent(data2,d=>d.bachelorsOrHigher).reduce((a,b)=>b-a)/(color.range().length-1)
    var thresholds=[d3.min(data2,d=>d.bachelorsOrHigher)];
    var totalSum=thresholds[0];
    for (var i=0;i<7;i++) {
        thresholds.push(totalSum+=thresholdStep)
    }
    
    color.domain(thresholds)

    
    //render US map

    //convert topology data to geoJson (so can use d3.geoPath() later)
    geoJsonData=topojson.feature(data1,data1.objects.counties).features;
    //MERGE topology data above with data2 WITH 2 PROPERTIES (area_name & bachelorsOrHigher) FOR EASE OF DATA-JOIN LATER
    geoJsonData.forEach(array=>{
        array.area_name=data2.filter(f=>array.id===f.fips)[0].area_name
        array.bachelorsOrHigher=data2.filter(f=>array.id===f.fips)[0].bachelorsOrHigher
    })
    //data join
    var update=svg.selectAll("path")
        .data(geoJsonData)

    var enter=update.enter().append("path")
            .attr("d",d3.geoPath())
            .attr("data-fips",d=>d.id)
            .attr("data-education",d=>d.bachelorsOrHigher)
            .attr("class","county")
            .attr("opacity","0")
            .style("fill",d=>color(d.bachelorsOrHigher))
            .on("mouseover",(d,i,nodes)=>{
                d3.select("#tooltip")
                        .attr("data-education",d.bachelorsOrHigher)
                        .html("County: "+d.area_name+"<br>Percentage %: "+d.bachelorsOrHigher)
                        .style("left",(d3.event.pageX+20)+"px")
                        .style("top",(d3.event.pageY-20)+"px")
                    .transition().duration(300)
                        .style("opacity","0.9");

                d3.select(nodes[i])
                        .style("stroke","white")
                        
                        
            })
            .on("mouseout",(d,i,nodes)=>{
                d3.select("#tooltip")
                    .transition().duration(300)
                        .style("opacity","0");

                d3.select(nodes[i])
                        .style("stroke","none")
            })
            
        .transition().duration(1000)
            .attr("opacity","1")

    //draw state borders only using topology.mesh() (unlike above topology.feature which draws polygons including overlapping borders)
        svg.append("path")
                .datum(topojson.mesh(data1,data1.objects.states))
                .attr("d",d3.geoPath())
                .attr("fill","none")
                .attr("stroke","white")
    

    //legend data join
    var tempColorRange=color.range().slice()
    tempColorRange.pop();

    legend.selectAll("rect")
        .data(tempColorRange).enter().append("rect")
            .attr("x",(d,i)=>i*40)
            .attr("width","40")
            .attr("height","20")
            .attr("fill",d=>d)
            .attr("opacity","0")
        .transition().duration(1000)
            .attr("opacity","1")     
    //legend text   
    legendText.selectAll("text")
        .data(color.domain().map(d=>d.toFixed(2))).enter().append("text")
            .attr("x",(d,i)=>i*40)
            .attr("dy","0.8em")
            .attr("dx","0.3em")
            .attr("width","40")
            .style("font-size","10px")
            .style("fill","white")
            .text(d=>"< "+d)
            .attr("opacity","0")
        .transition().duration(1000)
            .attr("opacity","1")  
    

}



