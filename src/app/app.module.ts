import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppComponent } from './app.component';
import { SettingsComponent } from './settings/settings.component';
import { AnalysisComponent } from './analysis/analysis.component';
import { AfterworkComponent } from './afterwork/afterwork.component';
import { KeyboardComponent } from './keyboard/keyboard.component';
import { SplitComponent } from './afterwork/split/split.component';
import { ClipComponent } from './afterwork/clip/clip.component';
import { MergeComponent } from './afterwork/merge/merge.component';
import { EditComponent } from './afterwork/edit/edit.component';

import { OpenFileService } from './dialogs/openFile.service';
import { ExportFileService } from './dialogs/exportFile.service';
import { TranslateService } from '@ngx-translate/core';

export function HttpLoaderFactory(http: HttpClient) {
	return new TranslateHttpLoader(http, './assets/lang/', '.json');
}

@NgModule({
	declarations: [
		AppComponent,
		SettingsComponent,
		AnalysisComponent,
		AfterworkComponent,
		KeyboardComponent,
		SplitComponent,
		ClipComponent,
		MergeComponent,
		EditComponent
	],
	imports: [
		NgbModule.forRoot(),
		BrowserModule,
		FormsModule,
		HttpClientModule,
		TranslateModule.forRoot({
			loader: {
				provide: TranslateLoader,
				useFactory: HttpLoaderFactory,
				deps: [HttpClient]
			}
		})
	],
	providers: [
		TranslateService,
		OpenFileService,
		ExportFileService
	],
	bootstrap: [AppComponent]
})
export class AppModule {
	consturtor() {
	}
}
