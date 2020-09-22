# [2017] Software Piracy Project

This project was made to showcase data, collected from multiple sources, using graphs and maps. The goal is to demonstrate the existence of correlations between author's thesis and real data. In particular, the existence of a correlation between the wealth of a country (GDP), of certain areas (continents) etc. and their illegal software rate followed by a short analysis of security risks connected to the usage of pirated software.

------------
###### Created on: 06/2017 / Live version: https://lukasd2.github.io/Software-Piracy-Project
**Please note that this project is outdated and not will not be maintained.**
------------
### Technologies/features:

- Javascript, HTML, CSS
- jQuery
- mapael (https://www.vincentbroute.fr/mapael/)
- OpenRefine (http://openrefine.org/)
- Highcharts (https://www.highcharts.com/)
- PHP *
- mySQL *

*The original version of the project was made with PHP back-end support integrated with mySQL database. However, this version fetches a copy of the database from JSON file (mergedDatabase.json) this is due to practical reasons, it allows to showcase a live version of the project directly on github.

#### Description: 

* First phase: data collection.
Main sources: BSA survey (https://globalstudy.bsa.org/2016/downloads/studies/BSA_GSS_US.pdf),
Worldbank API (https://datahelpdesk.worldbank.org/knowledgebase/articles/889386-developer-information-overview).
Next step was to combine data with OpenRefine. Data containing software piracy information were enriched with indicators e.g. Worldbank’s country income level, GDP, universal country code etc. 
This was done directly from OpenRefine using GREL Refine Expression and regex syntax to automatically fetch data from worldbank api. E.g. of universal data fetch used (to give an idea of how it looks): `http://api.worldbank.org/countries/"+value+"/indicators/NY.GNP.PCAP.CD?date="+cells.Anno.value+"&format=json`

* Second phase: data visualization, an important part of it was the right formatting depending on graphs type, map proprieties etc. In this case everything is done in Javascript. E.g. the input field is connected to the map to provide suggestions and redirect to selected country on the map.

* Third phase: data analysis, conclusions based on the result showed in each section of the website.

### Challenges/issues: 

Data formatting constraints werene not easy to meet at the start, but I would say it’s probably not a big deal when using libraries/plugins for the first time. Also, in this version, some JavaScript code is adapted to provide back-end functionality and is not properly refactored.