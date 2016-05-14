#How to add a LIFX Datasource

Here we will be showing you how to add a LIFX Bulb datasource to your freeboard:

###An example of what your finished dashboard might look like:

![dashboard](images/dashboard.png)

###First, add a Datasource, and choose LIFX Bulb from the dropdown list.

![step1](images/step1.png)

###Next, you will be prompted to fill out a form:

![step2](images/step2.png)

Choose any name that will help you identify your bulb.

###Generate an access token by clicking the link "here" in the description.

It will open a new window which will prompt you to sign into your LIFX account that you created when you installed the LIFX app.

![step3](images/step3.png)

###After you sign in, click on the button "Generate New Token"

![step4](images/step4.png)

###Name your token.

![step5](images/step5.png)

###After you name your token, copy and paste it in the appropriate field.

This allows freeboard to access the data from your bulbs.

![step6](images/step6.png)

###Next, put the name of your bulb exactly as it appears in the app into the Label field.

The label is needed for freeboard to know which bulb you want to query. Labels should be unique, otherwise the first bulb matching the label will the datasource. The label of my bulb is "Home Office 1".

![label](images/label.PNG)

###When you're finished, your form should look like this:

![step7](images/step7.png)

##You are now ready to add some widgets!

###First, click on "+ ADD PANE"

You should end up with an empty pane like this:

![about1](images/about1.png)

In this tutorial, we are going to recreate the example dashboard, so my first pane will include information about the bulb.

###Edit the name of your pane

Click on the wrench, fill in the name with Serial Number, and save.

![about2](images/about2.png)

![about3](images/about3.png)

###Add some information from your datasource
Click on the "+"

![about4](images/about4.png)

Select "Text" as your widget type

![about5](images/about5.png)

For the value, first choose the name of your datasource, then choose id. Id in this case is the same as the serial number.
Save.

![about6](images/about6.png)

Adding text widgets to display the rest of the information in the About pane is the same, so I will not show the steps for the sake of brevity.

###Status

There are two data points that can be displayed using indicator lights: connection and power.

Let's tackle connection first. Add a new pane, name it status, and then add a widget and select indicator light as the type.

![status1](images/status1.png)

Fill out the fields, I recommend using the values below. Connected returns true or false, which will result in the indicator light being on or off.

![status2](images/status2.png)

Now, let's add power. Here are the settings I used:

![status3](images/status3.png)

###Color

If your bulb is color capable, you can see what color it is giving off with an html widget.

Add a widget and select HTML as the type.

![color1](images/color1.png)

For the datasource, be sure to choose "color_html".

![color2](images/color2.png)

You can also add a text widget in order to display the color in rgb.

![color3](images/color3.png)

Color of light can also be expressed in terms of hue, saturation, brightness, and kelvin.

Use text widgets if you wish to view these datapoints.

##Congratulations! You are now a master of adding LIFX Datasources! 
