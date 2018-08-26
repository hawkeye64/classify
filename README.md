# classify
CLI for node classification

This package is written to be used as a Node command-line interface (CLI).

## Example Classification
![Unclassified Bicycle](images/test/bicycle.jpg?raw=true "Unclassified Bicycle")
![Classified Bicycle](images/results/bicycle_classified_coco300_30.jpg?raw=true "Classified Bicycle")

## Pre-Installation
This package uses opencv4nodejs which downloads and compiled opencv into Node.

Make sure you have **cmake** installed and available on your path or the build will fail.

To verify cmake, run:

```command -v cmake```

If available, you should see something like this:

```
$ command -v cmake
/usr/bin/cmake
```
If it is not available, then it will be like this:

```
$ command -v cmake
$
```

## Installation
Note: Not available via npm (yet!)

```npm i -g classify```

This installs it globally into your Node ecosystem and makes it available on your path.

## Back Story
This is my first foray into **Classification** with **Neural Networks**. Another programmer at work did something similar in Python. I wanted to know if it was at all possible to do the same thing with Node. I found **tensorflow.js** and then **tfjs-node** (tensorflow for node), but had issues getting models converted to a web-friendly format for it to work. Then I found **opencv4nodejs** and after that things fell into place. This cli project is the results of that endeavor. Feel free to add PRs if you would like it updated.

## Options
Running **classify** from the command-line will output the following:

**classify**
Classifies an image using machine learning from passed in image path.

**Options**

**--image** _imagePath_ [required] The image path.

  **--confidence** _value_ [optional; default 50] The minimum confidence level to use for classification. (ex: 50 for 50%).

  **--filter** _filterFile_ [optional] A filter file used to filter out classification not wanted.

  **--quick** [optional; default slow] Use quick classification, but may be more inaccurate.

  **--version** Application version.

  **--help** Print this usage guide.

## Image
**--image** or **-i** followed by the path to the image to classify.

## Confidence
**--confidence** or **-c** followed by the confidence value as a percentage (whole number). For instance, to filter out any levels less than 50%, use **--confidence _50_**.

## Filter
**--filter** or **-f** followed by a path to the filter file. 

A filter file contains only the interested items from the model that you might be interested in classifying. It contains one item per line. There should be no empty lines or comments.

**Example**
```
bear
bicycle
bird
bus
car
cat
cow
dog
horse
motorcycle
person
sheep
train
truck
```
## Quick
**--quick** or **-q** specifies to use the 300x300 Coco SSD instead of the 512x512. The 300x300 is faster, but may come at the cost of less classified items.

## Version
**--version** or **-v** outputs the curent version.

## Help
**--help** or **-h** displays the help output.

## Output
The classified image will be output in the current directory. It is renamed in the following format:

`<orig_filename>_classified_<modelType>_<confidence>.<extension>`

So, `bicycle.jpg` becomes `bicycle_classified_coco300_30.jpg`, with the latter containing rects and classification (if any exist).

## Examples

`classify --image ./images/test/bicycle.jpg --quick`

`classify --image ./images/test/train.jpg --confidence 50`

`classify --image ./images/test/royals.jpg --filter ./filter.txt`

`classify --image ./images/test/snapshot_001.jpg --filter ./filter.txt --confidence 50`


## More Examples
![Unclassified Royals](images/test/royals.jpg?raw=true "Unclassified Royals")
![Classified Royals](images/results/royals_classified_coco512_30.jpg?raw=true "Classified Royals")

![Unclassified Train](images/test/train.jpg?raw=true "Unclassified Train")
![Classified Train](images/results/train_classified_coco512_50.jpg?raw=true "Classified Train")

## Too Many Classifications
If you have an image with a lot of "action", consider filtering using the **--filter** parameter or at least the **--confidence** parameter.

This is what a classification looks like without either:

![No Filtering](images/results/snapshot_001_classified_coco512_0.jpg?raw=true "No Filtering")

And, what it looks like after filtering:

![No Filtering](images/results/snapshot_001_classified_coco512_30.jpg?raw=true "No Filtering")

