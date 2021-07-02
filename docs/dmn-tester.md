# DMN Tester
![img.png](../images/dmn-tester.png)
*sroll below dmn-editor*
## Use case (beverages for example)
*load dmn like [this](https://consulting.camunda.com/dmn-simulator/)*
1. Enter required values and click evaluate main decision
![img_2.png](../images/dmn-evaluate.png)
2. Now you can see results and save as test case
![img_3.png](../images/dmn-save-as-test-case.png)
   also results will be highlihted in editor (you can change tabs to see results in related dmn tables)
   ![img_5.png](../images/dmn-highlight-results.png)
3. Run saved test cases
![img_4.png](../images/dmn-run-saved-cases.png)
4 Do some changes in dmn editor  
   ![img_6.png](../images/dmn-add-some-changes.png)
   and publish
   ![img_7.png](../images/dmn-publish.png)
5. Again run saved test cases   
   * and click to test case with *warning" and evaluate
   * now you can see difference in result 
    ![img_8.png](../images/dmn-difference-in-result.png)


### some feautures
* autocomplite by predefined values
![img.png](../images/dmn-predefined-values.png)
* required values
![img.png](../images/dmn-required-values.png)
* add not defined parameters
![img_1.png](../images/dmn-add-parameter.png)
* save input parametes settings 
![img.png](../images/dmn-save-variables.png)
* evaluate with params
* check required params (also javascript not defined params)
* save test cases
    update test cases
    compare test cases result
* test cases / inputs / dmn - stored in [files](files.md) and you can store them in [git](git.md)
* difference between stored test case and responce
* testing works by tenant-id (generates randomly or uses you login from git)
