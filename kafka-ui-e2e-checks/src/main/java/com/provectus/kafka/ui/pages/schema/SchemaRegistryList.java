package com.provectus.kafka.ui.pages.schema;

import static com.codeborne.selenide.Selenide.$x;

import com.codeborne.selenide.Condition;
import com.codeborne.selenide.SelenideElement;
import com.provectus.kafka.ui.pages.BasePage;
import io.qameta.allure.Step;

public class SchemaRegistryList extends BasePage {

    protected SelenideElement createSchemaBtn = $x("//button[contains(text(),'Create Schema')]");
//    protected SelenideElement schemaGrid = $x("//table");
//    protected String schemaTabElementLocator = "//a[contains(text(),'%s')]";

    @Step
    public SchemaRegistryList waitUntilScreenReady(){
        waitUntilSpinnerDisappear();
        createSchemaBtn.shouldBe(Condition.visible);
        return this;
    }

    @Step
    public SchemaRegistryList clickCreateSchema() {
        clickByJavaScript(createSchemaBtn);
        return this;
    }

    @Step
    public SchemaRegistryList openSchema(String schemaName) {
        $x(String.format(tableElementNameLocator,schemaName))
                .shouldBe(Condition.enabled).click();
        return this;
    }

    @Step
    public boolean isSchemaVisible(String schemaName) {
        tableGrid.shouldBe(Condition.visible);
        return isVisible($x(String.format(tableElementNameLocator,schemaName)));
    }
}


