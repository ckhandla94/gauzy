import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { EmployeesService } from '../../../../../@core/services/employees.service';
import {
	Organization,
	EmployeeTypesCreateInput,
	EmployeeTypes
} from '@gauzy/models';
import { takeUntil } from 'rxjs/operators';
import { OrganizationEditStore } from '../../../../../@core/services/organization-edit-store.service';
import { OrganizationEmpTypesService } from '../../../../../@core/services/organization-emp-types.service';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { DeleteConfirmationComponent } from '../../../../../@shared/user/forms/delete-confirmation/delete-confirmation.component';
import { TranslateService } from '@ngx-translate/core';
import { ErrorHandlingService } from '../../../../../@core/services/error-handling.service';

@Component({
	selector: 'ga-edit-org-emptypes',
	templateUrl: './edit-organization-employeeTypes.component.html'
})
export class EditOrganizationEmployeeTypes implements OnInit, OnDestroy {
	private _ngDestroy$ = new Subject<void>();
	form: FormGroup;
	selectedEmployeeType: EmployeeTypes;
	organization: Organization;
	empTypes: EmployeeTypesCreateInput[];

	constructor(
		private fb: FormBuilder,
		private translateService: TranslateService,
		private errorHandler: ErrorHandlingService,
		private toastrService: NbToastrService,
		private employeeService: EmployeesService,
		private dialogService: NbDialogService,
		private organizationEditStore: OrganizationEditStore,
		private organizationEmpTypesService: OrganizationEmpTypesService
	) {}

	ngOnInit(): void {
		this._initializeForm();
		this.organizationEditStore.selectedOrganization$
			.pipe(takeUntil(this._ngDestroy$))
			.subscribe((data) => {
				this.organization = data;
				if (this.organization) {
					this.employeeService
						.getEmpTypes(this.organization.id)
						.pipe(takeUntil(this._ngDestroy$))
						.subscribe((types) => {
							this.empTypes = types;
						});
				}
			});
	}

	private _initializeForm() {
		this.form = this.fb.group({
			name: ['', Validators.required]
		});
	}

	submitForm() {
		const name = this.form.controls['name'].value;
		const newEmpType = {
			name,
			organizationId: this.organization.id
		};
		this.employeeService
			.addEmpType(newEmpType)
			.pipe(takeUntil(this._ngDestroy$))
			.subscribe((data) => {
				this.empTypes.push(data);
			});
		this.form.reset();
	}

	delete(selectedEmployeeType) {
		this.dialogService
			.open(DeleteConfirmationComponent)
			.onClose.pipe(takeUntil(this._ngDestroy$))
			.subscribe(async (result) => {
				if (result) {
					try {
						await this.organizationEmpTypesService.deleteEmployeeType(
							selectedEmployeeType.id
						);
						const message = this.translateService.instant(
							'TOASTR.MESSAGE.DELETE_EMPLOYEE_TYPE',
							{ name: selectedEmployeeType.name }
						);
						const succes = this.translateService.instant(
							'TOASTR.TITLE.SUCCESS'
						);
						this.toastrService.primary(message, succes);
						const index = this.empTypes.indexOf(
							selectedEmployeeType
						);
						this.empTypes = this.empTypes.splice(index, 1);
					} catch (error) {
						this.errorHandler.handleError(error);
					}
				}
			});
	}

	async update(empType) {
		try {
			await this.organizationEmpTypesService.update(empType);
			const message = this.translateService.instant(
				'TOASTR.MESSAGE.UPADTED_EMPLOYEE_TYPE'
			);
			const succes = this.translateService.instant(
				'TOASTR.TITLE.SUCCESS'
			);
			this.toastrService.primary(message, succes);
		} catch (error) {
			this.errorHandler.handleError(error);
		}
	}

	ngOnDestroy() {
		this._ngDestroy$.next();
		this._ngDestroy$.complete();
	}
}
