import * as d3 from "d3-selection";
import "../assets/fretboard.css";

// Music
const allNotes = [
  "c",
  "c#",
  "d",
  "d#",
  "e",
  "f",
  "f#",
  "g",
  "g#",
  "a",
  "a#",
  "b",
];
const allNotesEnh = [
  "c",
  "db",
  "d",
  "eb",
  "fb",
  "f",
  "gb",
  "g",
  "ab",
  "a",
  "bb",
  "cb",
];

const colors = [
  "red",
  "green",
  "blue",
  "black",
  "purple",
  "gray",
  "orange",
  "lightgray",
];


export const Scales = {
  // scales
  lydian: "c d e f# g a b",
  major: "c d e f g a b",
  mixolydian: "c d e f g a bb",
  dorian: "c d eb f g a bb",
  aeolian: "c d eb f g ab bb",
  phrygian: "c db eb f g ab bb",
  locrian: "c db eb f gb ab bb",
  "harmonic-minor": "c d eb f g ab b",
  "melodic-minor": "c d eb f g a b",
  "minor-pentatonic": "c eb f g bb",
  "minor-blues": "c eb f f# g bb",
  "major-pentatonic": "c d e g a",
  "major-blues": "c d d# e g a",
  "composite-blues": "c d d# e f f# g a bb",
  "dom-pentatonic": "c e f g bb",
  japanese: "c db f g ab",
  // chords
  maj: "c e g",
  aug: "c e g#",
  min: "c eb g",
  dim: "c eb gb",
  maj7: "c e g b",
  7: "c e g bb",
  min7: "c eb g bb",
  m7b5: "c eb gb bb",
  dim7: "c eb gb a",
  _: function (scale) {
    return Scales[scale].split(" ");
  },
};

let createArray = function(x, l) {
    x = [].concat(x) // guarantee we are starting with an array
    while(x.length < l) {
      x = x.concat(x)
    }
    return(x.slice(0, l))
}

let parseData = function(x) {
  var r;
  if(!x) {
    return(null) // gracefully handle null argument
  }
  if(x.match(/\w\s[\w#]/)) {
    r = x.split(/\s+/);
  } else {
    r = x;
  }
  return(r)
}

export function whatIs(sequence) {
  let sections = sequence.split(" ");
  if (sections.length === 2 && typeof Scales[sections[1]] === "string") {
    return "scale";
  }
  if (sections[0].indexOf(":") > 0) {
    return "placeNotes";
  } else {
    return "addNotes";
  }
}

export function asOffset(note) {
  note = note.toLowerCase();
  let offset = allNotes.indexOf(note);
  if (offset === -1) {
    offset = allNotesEnh.indexOf(note);
  }
  return offset;
}

export function absNote(note) {
  let octave = note[note.length - 1];
  let pitch = asOffset(note.slice(0, -1));
  if (pitch > -1) {
    return pitch + octave * 12;
  }
}

export function noteName(absPitch) {
  let octave = Math.floor(absPitch / 12);
  let note = allNotes[absPitch % 12];
  return note + octave.toString();
}

export function asNotes(scale) {
  let [root, type] = scale.split(" ");
  let scaleInC = Scales._(type);
  let offset = asOffset(root);
  let scaleTransposed = scaleInC.map(function (note) {
    return allNotes[(asOffset(note) + offset) % 12];
  });
  return scaleTransposed.join(" ");
}

// Fretboard
export const Tunings = {
  bass4: {
    standard: ["e1", "a1", "d2", "g2", "b2", "e3"],
  },
  guitar6: {
    standard: ["e2", "a2", "d3", "g3", "b3", "e4"],
    E_4ths: ["e2", "a2", "d3", "g3", "c4", "f4"],
    Drop_D: ["d2", "a2", "d3", "g3", "b3", "e4"],
    G_open: ["d2", "g2", "d3", "g3", "b3", "d4"],
    DADGAD: ["d2", "a2", "d3", "g3", "a3", "d4"],
  },
  guitar7: {
    standard: ["b2", "e2", "a2", "d3", "g3", "b3", "e4"],
    E_4ths: ["b2", "e2", "a2", "d3", "g3", "c3", "f4"],
  },
};

const defaults = {
  frets: 12,
  startFret: 0,
  strings: 6,
  tuning: Tunings.guitar6.standard,
  fretWidth: 50,
  fretHeight: 20,
  fretboardColor: "white",
  stringColors: "gray",
  stringWidths: 1,
  leftHanded: false,
  dotRadius: 4,
  dotColor: "#ddd",
  showTitle: false,
  showNames: false,
  nameSize: "6pt",
  nameColors: "black",
  radius: 6,
  fillColors: "white",
  lineColors: null,
  overlay: null,
  overlayFillColors: null,
  overlayColors: null,
  overlayNameColors: null
}

export const Fretboard = function (config) {
  config = config || {};
  let where = config.where || "body";

  let id = "fretboard-" + Math.floor(Math.random() * 1000000);

  let instance = {
    ...defaults,
    ...config,
  };
  instance.notes = [];
  instance.radius = instance.radius || 6 // catch passing null for radius
  instance.dotRadius = instance.dotRadius || 4 // ditto

  // METHODS for dynamic prop changes ---------------------------

  instance.set = (prop, value) => {
    instance[prop] = value;
    instance.repaint();
  };

  // METHODS for managing notes ---------------------------------

  instance.addNoteOnString = function (note, string, color, fill, nameColor) {
      instance.notes.push({ note, string, color, fill, nameColor });
    return instance;
  };

  instance.addNote = function (note, color, fill, nameColor) {
    for (let string = 1; string <= instance.strings; string++) {
      instance.addNoteOnString(note, string, color, fill, nameColor);
    }
    return instance;
  };

  instance.addNotes = function (notes) {
    let allNotes = notes.split(" ");
    let lineColors = instance.colors ? instance.colors : colors;
    let fillColors = createArray(instance.fillColors, allNotes.length)
    let nameColors = createArray(instance.nameColors, allNotes.length)
    lineColors = createArray(lineColors, allNotes.length)

    for (let i = 0; i < allNotes.length; i++) {
      let note = allNotes[i];
      for (let octave = 1; octave < 7; octave++) {
        instance.addNote(note + octave, lineColors[i], fillColors[i], nameColors[i]);
      }
    }
    return instance;
  };

  instance.scale = function (scaleName) {
    instance.addNotes(asNotes(scaleName));
    return instance;
  };

  instance.placeNotes = function (sequence) {
    // Sequence of string:note
    // e.g. "6:g2 5:b2 4:d3 3:g3 2:d4 1:g4"
    let pairs = sequence.split(" "); 
    // note collections should have gray outline by default 
    // rather than the default line colors of scales.
    let lineColors = instance.colors ? instance.colors : "gray";
    let fillColors = createArray(instance.fillColors, pairs.length)
    let nameColors = createArray(instance.nameColors, pairs.length)
    lineColors = createArray(lineColors, pairs.length)
    pairs.forEach(function (pair, i) {
      const [string, note] = pair.split(":");
      instance.addNoteOnString(note,  
                               parseInt(string),
                               lineColors[i],
                               fillColors[i],
                               nameColors[i]); // , i==0? "red" : "black");
    });
    return instance;
  };

  instance.add = function (something) {
    let sections = something.trim().replace(/\s\s+/g, " ").split(";");
    sections.forEach(function (section) {
      section = section.trim();
      let what = whatIs(section);
      instance[what](section);
    });
    return instance;
  };

  // convenience function to add additional notes. 
  // Useful, for example, to see specific notes (e.g. triads) in context of a scale
  instance.addOverlay = function(notes, colors, fills, nameColors) {
    notes = [].concat(notes) // make sure we have an array
    colors = colors ? colors : instance.overlayColors;
    fills = fills ? fills : instance.overlayFillColors;
    nameColors = nameColors ? nameColors : instance.overlayNameColors;
    colors = createArray(colors, notes.length)
    fills = createArray(fills, notes.length)
    nameColors = createArray(nameColors, notes.length)
    notes.forEach((n,i) => { 
      var [a, b] = n.split(":");
      if(b) {
        instance.addNoteOnString(b, parseInt(a), colors[i], fills[i], nameColors[i]);
      }  else {
        instance.addNote(a, colors[i], fills[i], nameColors[i]);
      }
    })
    return(notes);
  }

  instance.clearNotes = function () {
    instance.notes = [];
    instance.svgContainer.selectAll(".note").remove();
    return instance;
  };
  
  // METHODS for drawing -------------------------------------------

  let fretFitsIn = function (fret) {
    return fret > instance.startFret && fret <= instance.frets;
  };

  let fretsWithDots = function () {
    let allDots = [3, 5, 7, 9, 15, 17, 19, 21];
    return allDots.filter(fretFitsIn);
  };

  let fretsWithDoubleDots = function () {
    let allDots = [12, 24];
    return allDots.filter(fretFitsIn);
  };

  let fretboardHeight = function () {
    return (instance.strings - 1) * instance.fretHeight + 2;
  };

  let fretboardWidth = function () {
    return (instance.frets - instance.startFret) * instance.fretWidth + 2;
  };

  let XMARGIN = function () {
    return instance.fretWidth;
  };
  let YMARGIN = function () {
    return instance.fretHeight;
  };

  let makeContainer = function (elem) {
    instance.width = fretboardWidth() + XMARGIN() * 2;
    instance.height = fretboardHeight() + YMARGIN() * 2;

    let container = d3
      .select(elem)
      .append("div")
      .attr("class", "fretboard")
      .attr("id", id)
      .append("svg")
      .attr("width", instance.width)
      .attr("height", instance.height)

      if (instance.leftHanded) {
        container = container
          .append("g")
          .attr("transform", "scale(-1,1) translate(-" + (instance.width-XMARGIN()) + ",0)");
      }

      container
        .append("rect")
        .attr("x", XMARGIN())
        .attr("y", YMARGIN())
        .attr("width",  fretboardWidth())
        .attr("height", fretboardHeight())
        .style("fill", instance.fretboardColor);

    return container;
  };

  let drawFrets = function () {
    for (let i = instance.startFret; i <= instance.frets; i++) {
      // BEWARE: the coordinate system for SVG elements uses a transformation
      // for lefties, however the HTML elements we use for fret numbers and
      // tuning we transform by hand.
      let x = (i - instance.startFret) * instance.fretWidth + 1 + XMARGIN();
      let fretNumX = x;
      if (instance.leftHanded) {
        fretNumX = instance.width - XMARGIN() - x;
      }
      // fret
      instance.svgContainer
        .append("line")
        .attr("x1", x)
        .attr("y1", YMARGIN())
        .attr("x2", x)
        .attr("y2", YMARGIN() + fretboardHeight())
        .attr("stroke", "lightgray")
        .attr("stroke-width", i === 0 ? 8 : 2);
      // number
      d3.select("#" + id)
        .append("p")
        .attr("class", "fretnum")
        .style("top", fretboardHeight() + YMARGIN() + 5 + "px")
        .style("left", fretNumX - 4 + "px")
        .text(i);
    }
  };

  let drawStrings = function () {
    let stringWidths = createArray(instance.stringWidths, instance.strings);
    let stringColors = createArray(instance.stringColors, instance.strings);
    for (let i = 0; i < instance.strings; i++) {
      instance.svgContainer
        .append("line")
        .attr("x1", XMARGIN())
        .attr("y1", i * instance.fretHeight + 1 + YMARGIN())
        .attr("x2", XMARGIN() + fretboardWidth())
        .attr("y2", i * instance.fretHeight + 1 + YMARGIN())
        .attr("stroke", stringColors[i])
        .attr("stroke-width", stringWidths[i]);
    }
    let placeTuning = function (d, i) {
      return (instance.strings - i) * instance.fretHeight - 4 + "px";
    };

    let toBaseFretNote = function (note) {
      return noteName(absNote(note) + instance.startFret);
    };

    let hPosition = instance.leftHanded ? instance.width - XMARGIN() - 16 + "px" : "4px";

    d3.select("#" + id)
      .selectAll(".tuning")
      .data(instance.tuning.slice(0, instance.strings))
      .style("top", placeTuning)
      .text(toBaseFretNote)
      .enter()
      .append("p")
      .attr("class", "tuning")
      .style("top", placeTuning)
      .style("left", hPosition)
      .text(toBaseFretNote);
  };

  let drawDots = function () {
    let p = instance.svgContainer.selectAll("circle").data(fretsWithDots());

    function dotX(d) {
      return (
        (d - instance.startFret - 1) * instance.fretWidth +
        instance.fretWidth / 2 +
        XMARGIN()
      );
    }

    function dotY(ylocation) {
      let margin = YMARGIN();

      if (instance.strings % 2 === 0) {
        return (
          ((instance.strings + 3) / 2 - ylocation) * instance.fretHeight +
          margin
        );
      } else {
        return (fretboardHeight() * ylocation) / 4 + margin;
      }
    }

    p.enter()
      .append("circle")
      .attr("cx", dotX)
      .attr("cy", dotY(2))
      .attr("r", instance.dotRadius)
      .style("fill", instance.dotColor);

    p = instance.svgContainer.selectAll(".octave").data(fretsWithDoubleDots());

    p.enter()
      .append("circle")
      .attr("class", "octave")
      .attr("cx", dotX)
      .attr("cy", dotY(3))
      .attr("r", instance.dotRadius)
      .style("fill", instance.dotColor);
    p.enter()
      .append("circle")
      .attr("class", "octave")
      .attr("cx", dotX)
      .attr("cy", dotY(1))
      .attr("r", instance.dotRadius)
      .style("fill", instance.dotColor);
  };

  instance.drawBoard = function () {
    instance.delete();
    instance.svgContainer = makeContainer(where);
    drawFrets();
    drawDots();
    drawStrings();
    return instance;
  };

  function paintNote(note, string, color, fill, nameColor) {
    if (string > instance.strings) {
      return false;
    }
    let absPitch = absNote(note);
    let actualColor = color || "black";
    let actualFill = fill || "white";
    let actualNameColor = nameColor || "gray";
    let absString = instance.strings - string;
    let basePitch = absNote(instance.tuning[absString]) + instance.startFret;
    if (
      absPitch >= basePitch &&
      absPitch <= basePitch + instance.frets - instance.startFret
    ) {
      const circle = instance.svgContainer
        .append("circle")
        .attr("class", "note")
        .attr("stroke-width", 1)
        // 0.75 is the offset into the fret (higher is closest to fret)
        .attr("cx", (absPitch - basePitch + 0.75) * instance.fretWidth)
        .attr("cy", (string - 1) * instance.fretHeight + 1 + YMARGIN())
        .attr("r", instance.radius)
        .style("stroke", actualColor)
        .style("fill", actualFill)
        .on("click", function () {
          this.setAttribute(
            "stroke-width",
            5 - parseInt(this.getAttribute("stroke-width"))
          );
        });

        if (instance.showTitle) {
          circle.append("title").text(note.toUpperCase());
        }

        var orientation = 1;
        var scale = "scale(1,1)"
        if(instance.leftHanded) {
          orientation = -1
          scale = "scale(-1,1)"
        }

        if(instance.showNames)
        {
          instance.svgContainer
          .append("text")
          .text(note.substring(0, note.length - 1))
          .attr("dx", orientation * (absPitch - basePitch + 0.75) * instance.fretWidth)
          .attr("dy", (string - 1) * instance.fretHeight + 2 + YMARGIN())
          .attr("dominant-baseline", "central") // keep centered at any size
          .attr("class", "fretnum")
          .style("text-anchor", "middle")
          .style("fill", actualNameColor)
          .style("font-size", instance.nameSize)
          .style("text-transform", "capitalize")
          .attr("transform", scale)
        }
      return true;
    }
    return false;
  }

  instance.paint = function () {
    for (let { note, string, color, fill, nameColor } of instance.notes) {
      paintNote(note, string, color, fill, nameColor);
    }
  };

  instance.repaint = function () {
    instance.drawBoard();
    instance.paint();
  };

  instance.clear = function () {
    instance.clearNotes();
    const el = document.getElementById(id);
    el.parentNode.removeChild(el);
    instance.drawBoard();
    return instance;
  };

  instance.delete = function () {
    d3.select("#" + id).remove();
  };

  instance.getNotes = function () {
    return instance.notes;
  };

  return instance.drawBoard();
}

Fretboard.getData = function(d, instance) { // parse element data elements
  instance = instance || defaults;
  let r = {};
  for(var e in instance) {
    let el = e.toLowerCase() // all element data names get lowercased
    r[e] = d[el] || instance[e]
    if(r[e] && r[e].match && !r[e].match(/\D/)) { // convert "14" to 14, but leave "14px" as "14px"
      r[e] = parseInt(r[e]) || r[e]
    }
    if(r[e] && r[e].match && r[e].match(" ")) { // convert arrays to arrays
      r[e] = parseData(r[e])
    }
  }
  return(r)
}

Fretboard.drawAll = function (selector, config) {
  let fretboards = document.querySelectorAll(selector);
    fretboards.forEach(function (e) {
      let instance = config ? {...defaults, ...config,} : {...defaults};
      let fretdef = e.dataset["frets"];
      if (fretdef && fretdef.indexOf("-") !== -1) {
        [instance.startFret, instance.frets] = fretdef.split("-").map(function (x) {
          return parseInt(x);
        });
      } else {
        [instance.startFret, instance.frets] = [0, parseInt(fretdef) || 8];
      }
      instance = Fretboard.getData(e.dataset, instance)
      instance.colors = parseData(e.dataset.colors) || instance.colors;
      let notes = e.dataset["notes"];
      let overlay = parseData(e.dataset["overlay"]);
      instance.where = e;

      let fretboard = Fretboard(instance);
      //fretboard.clearNotes();

    if (notes) {
      fretboard.add(notes);
    }
    if(overlay) {
      fretboard.addOverlay(overlay);
    }
    fretboard.paint();
  });
  return fretboards;
};

export function Guitar(strings, frets) {
  strings = strings || 6;
  frets = frets || 12;
  return Fretboard({
    strings: strings,
    frets: frets,
    tuning: Tunings["guitar" + strings].standard,
  });
}

export function Bass(strings, frets) {
  strings = strings || 4;
  frets = frets || 12;
  return Fretboard({
    strings: strings,
    frets: frets,
    tuning: Tunings["bass" + strings].standard,
  });
}
