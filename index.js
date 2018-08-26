#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')


/**
 * Returns true if the passed in object is empty
 * @param {Object} obj 
 */
const isEmptyObject = (obj) => {
  return JSON.stringify(obj) === JSON.stringify({})
}

/**
 * Extracts results from a network OutputBob
 * @param {Object} outputBlob The outputBlob returned from net.forward()
 * @param {Object} img The image used for classification
 */
const extractResultsCoco = (outputBlob, img) => {
  return Array(outputBlob.rows).fill(0)
    .map((res, i) => {
      // get class index
      const classIndex = outputBlob.at(i, 1);
      const confidence = outputBlob.at(i, 2);
      // output blobs are in a percentage
      const bottomLeft = new cv.Point(
        outputBlob.at(i, 3) * img.cols,
        outputBlob.at(i, 6) * img.rows
      );
      const topRight = new cv.Point(
        outputBlob.at(i, 5) * img.cols,
        outputBlob.at(i, 4) * img.rows
      );
      // create a rect
      const rect = new cv.Rect(
        bottomLeft.x,
        topRight.y,
        topRight.x - bottomLeft.x,
        bottomLeft.y - topRight.y
      );

      return ({
        classIndex,
        confidence,
        rect
      })
    })
}

/**
 * Generate a random color
 */
const getRandomColor = () => new cv.Vec(Math.random() * 255, Math.random() * 255, Math.random() * 255);

/**
 * Returns a function that, for each prediction, draws a rect area with rndom color
 * @param {Arry} predictions Array of predictions
 */
const makeDrawClassDetections = (predictions) => (drawImg, getColor, thickness = 2) => {
  predictions
    .forEach((p) => {
      let color = getColor()
      let confidence = p.confidence
      let rect = p.rect
      let className = classes[p.classIndex]
      drawRect(className, confidence, drawImg, rect, color, { thickness })
    })
  return drawImg
}

/*
  Take the original image and add rectanges on predictions.
  Write it to a new file.
 */
const updateImage = (imagePath, img, predictions) => {
  // get the filename and replace last occurrence of '.' with '_classified.'
  const filename = imagePath.replace(/^.*[\\\/]/, '').replace(/.([^.]*)$/,`_classified_${dataFile}_${confidence * 100.0}.` + '$1')

  // get function to draw rect around predicted object
  const drawClassDetections = makeDrawClassDetections(predictions);

  // draw a rect around predicted object
  drawClassDetections(img, getRandomColor);

  // write updated image to current directory
  cv.imwrite('./' + filename, img)
}

// draw a rect and label in specified area
/**
 * 
 * @param {String} className Predicted class name (identified object)
 * @param {Number} confidence The confidence level (ie: .80 = 80%)
 * @param {Object} image The image
 * @param {Object} rect The rect area
 * @param {Object} color The color to use
 * @param {Object} [opts={ thickness: 2 }] Options (currently only supports thikness)
 */
const drawRect = (className, confidence, image, rect, color, opts = { thickness: 2 }) => {
  let level = Math.round(confidence * 100.0)
  image.drawRectangle(
    rect,
    color,
    opts.thickness,
    cv.LINE_8
  )
  // draw the label (className and confidence level)
  let label = className + ': ' + level
  image.putText(label, new cv.Point2(rect.x, rect.y + 20), cv.FONT_ITALIC, .65, color, 2)
}

/**
 * Predicts classifications based on passed in image
 * @param {Object} img The image to use for predictions
 */
const predict = (img) => {
  // white is the better padding color
  const white = new cv.Vec(255, 255, 255)

  // resize to model size
  const theImage = img.resize(modelData.size, modelData.size).padToSquare(white)

  // network accepts blobs as input
  const inputBlob = cv.blobFromImage(theImage)
  net.setInput(inputBlob)

  // forward pass input through entire network, will return
  // classification result as (coco: 1x1xNxM Mat) (inception: 1xN Mat)
  let outputBlob = net.forward()

  if (dataFile === 'coco300' || dataFile === 'coco512') {
    // extract NxM Mat from 1x1xNxM Mat
    outputBlob = outputBlob.flattenFloat(outputBlob.sizes[2], outputBlob.sizes[3])
    // pass original image
    return extractResultsCoco(outputBlob, img)
  }
}

/**
 * Output time it took for classification
 * @param {Date} startDate 
 * @param {Date} endDate 
 */
const finalize = (startDate, endDate) => {
  let ms = endDate - startDate
  if (ms > 1000) {
    let sec = ms / 1000
    console.log(`Processed image in: ${sec}s`)
  }
  else {
    console.log(`Processed image in: ${ms}ms`)
  }
}

const commandLineUsage = require('command-line-usage')
const commandLineArgs = require('command-line-args')

const sections = [
  {
    header: 'classify',
    content: 'Classifies an image using machine learning from passed in image path.'
  },
  {
    header: 'Options',
    optionList: [
      {
        name: 'image',
        typeLabel: '{underline imagePath}',
        description: '[required] The image path.'
      },
      // {
      //   name: 'model',
      //   typeLabel: '{underline modelName}',
      //   description: '[optional, default coco] The model name to use (coco, inception).'
      // },
      {
        name: 'confidence',
        typeLabel: '{underline value}',
        description: '[optional; default 50] The minimum confidence level to use for classification (ex: 50 for 50%).'
      },
      {
        name: 'filter',
        typeLabel: '{underline filterFile}',
        description: '[optional] A filter file used to filter out classification not wanted.'
      },
      {
        name: 'quick',
        description: '[optional; default slow] Use quick classification, but may be more inaccurate.'
      },
      {
        name: 'version',
        description: 'Application version.'
      },
      {
        name: 'help',
        description: 'Print this usage guide.'
      }
    ]
  }
]
const usage = commandLineUsage(sections)

const optionDefinitions = [
  { name: 'image', alias: 'i', type: String },
  // { name: 'model', alias: 'm', type: String },
  { name: 'confidence', alias: 'c', type: Number },
  { name: 'filter', alias: 'f', type: String },
  { name: 'quick', alias: 'q' },
  { name: 'version', alias: 'v' },
  { name: 'help', alias: 'h' }
]

let options
try {
  options = commandLineArgs(optionDefinitions)
}
catch(e) {
  console.error()
  console.error('classify:', e.name, e.optionName)
  console.log(usage)
  process.exit(1)
}

// check for help
if (isEmptyObject(options) || 'help' in options) {
  console.log(usage)
  process.exit(1)
}

// check for version
if ('version' in options) {
  let pkg = require('./package.json')
  console.log(pkg.version)
  process.exit(1)
}

let imagePath

// check for path
if ('image' in options) {
  imagePath = options.image
}
if (!imagePath) {
  console.error('"--image imagePath" is required.')
  process.exit(1)
}

if (!fs.existsSync(imagePath)) {
  console.log(`exiting: could not find image: ${imagePath}`)
  process.exit(2)
}

let availableModels = ['coco', 'inception']
let model = 'coco' // default
if ('model' in options) {
  model = options.model
}

// check to see if an appropriate model was selected
if (!availableModels.includes(model)) {
  console.error(`Invalid model used: '${model}'. Acceptable models are: ${availableModels.join(', ')}`)
  process.exit(1)
}

let confidence = 30
if ('confidence' in options) {
  confidence = options.confidence
}

// validate confidence
if (confidence < 0) {
  console.error(`Negative numbers are not valid for 'confidence'.`)
  process.exit(1)
}
if (confidence > 100) {
  console.error(`A value greater than 100 is not valid for 'confidence'.`)
  process.exit(1)
}

confidence = confidence / 100.0

let filterItems = []
if ('filter' in options) {
  const filterFile = options.filter
  // verify file exist
  if (!fs.existsSync(filterFile)) {
    console.log(`exiting: could not find filter file: ${filterFile}`)
    process.exit(2)
  }
  filterItems = fs.readFileSync(filterFile).toString().split('\n')
}

// get quick option, if available - default to slow
let quick = false
if ('quick' in options) {
  quick = true
}

// get data file based on model and quick options
let dataFile
if (model === 'coco') {
  if (quick) {
    dataFile = 'coco300'
  }
  else {
    dataFile = 'coco512'
  }
}
else if (model === 'inception') {
  dataFile = 'inception224'
}

if (!dataFile) {
  console.error(`'${model}' is not valid model.`)
  process.exit(1)
}

// construct all the data needed
const modelData = require('./' + dataFile + '.json')
const modelPath = path.resolve(__dirname, modelData.path)
const prototxt = path.resolve(modelPath, modelData.prototxt)
const modelFile = path.resolve(modelPath, modelData.modelFile)
const classesFile = path.resolve(modelPath, modelData.classes)

// verify files exist
if (!fs.existsSync(prototxt)) {
  console.log(`exiting: could not find prototxt file: ${prototxt}`)
  process.exit(2)
}
if (!fs.existsSync(modelFile)) {
  console.log(`exiting: could not find model file: ${modelFile}`)
  process.exit(2)
}
if (!fs.existsSync(classesFile)) {
  console.log(`exiting: could not find model file: ${classesFile}`)
  process.exit(2)
}

// read the classes file and convert to array
const classesPath = path.resolve(modelPath, modelData.classes)
const classes = fs.readFileSync(classesPath).toString().split('\n')
if (classes.length === 0) {
  console.log(`exiting: could not parse classes file: ${classesPath}`)
  process.exit(2)
}

// OpenCV
const cv = require('opencv4nodejs')

// initialize model from prototxt and modelFile
let net
if (dataFile === 'coco300' || dataFile === 'coco512') {
  net = cv.readNetFromCaffe(prototxt, modelFile)
}
// else {
//   net = cv.readNetFromTensorflow(modelFile)
// }

// read the image
const img = cv.imread(imagePath)

// starting time of classification
let start = new Date()

// get predictions
const predictions = predict(img).filter((item) => {
  // filter out what we don't want
  if (item.confidence < confidence) {
    return false
  }
  // user wants to filter items
  if (filterItems.length > 0) {
    if (filterItems.indexOf(classes[item.classIndex]) < 0) {
      return false
    }
  }
  return true
})

// end of classification
let end = new Date()
finalize(start, end)

// write updated image with new name
updateImage(imagePath, img, predictions)
