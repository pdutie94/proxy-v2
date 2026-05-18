'use client';

import { Icon } from '@iconify/react';
import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Button, Table, Chip, Input } from '@heroui/react';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { locationSchema, LocationInput } from '../schemas/location.schema';
import { createLocationAction, deleteLocationAction } from '../actions/location.action';
import { toast } from '@heroui/react';

interface Location {
  id: string;
  name: string;
  countryCode: string;
  _count?: {
    servers: number;
  };
}

interface LocationManagementProps {
  initialLocations: Location[];
}

export function LocationManagement({ initialLocations }: LocationManagementProps) {
  const [locations, setLocations] = useState(initialLocations);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteLoc, setDeleteLoc] = useState<Location | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Filter State
  const [queryValue, setQueryValue] = useState('');

  const filteredLocations = locations.filter((loc) => {
    const name = loc.name.toLowerCase();
    const countryCode = loc.countryCode.toLowerCase();
    const searchLower = queryValue.toLowerCase();
    return name.includes(searchLower) || countryCode.includes(searchLower);
  });

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<LocationInput>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: '',
      countryCode: '',
    }
  });

  const onSubmit = async (data: LocationInput) => {
    const result = await createLocationAction(data);
    if (result.success && result.data) {
      toast.success('Thêm vị trí mới thành công');
      setLocations([result.data, ...locations]);
      setIsModalOpen(false);
      reset();
    } else {
      toast.danger(result.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = useCallback(async () => {
    if (!deleteLoc) return;
    
    setIsDeleting(deleteLoc.id);
    const result = await deleteLocationAction(deleteLoc.id);
    if (result.success) {
      toast.success('Đã xóa vị trí');
      setLocations(locations.filter(l => l.id !== deleteLoc.id));
      setDeleteLoc(null);
    } else {
      toast.danger(result.message || 'Có lỗi xảy ra');
    }
    setIsDeleting(null);
  }, [deleteLoc, locations]);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Quản lý Vị trí</h1>
          <p className="text-xs text-slate-400">Quản lý danh sách quốc gia và khu vực đặt máy chủ</p>
        </div>
        <Button
          size="sm"
          onPress={() => setIsModalOpen(true)}
          className="cursor-pointer font-medium text-sm h-9 px-3 flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-blue-600 text-white"
        >
          <Icon icon="lucide:plus" className="w-3.5 h-3.5 shrink-0" />
          Thêm vị trí
        </Button>
      </div>

      {/* Flat Premium Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 mb-4 mt-1">
        {/* Right Side: Search Input */}
        <div className="relative w-full sm:w-56">
          <Input
            type="text"
            placeholder="Tìm tên, mã QG..."
            value={queryValue}
            onChange={(e) => setQueryValue(e.target.value)}
            className="w-full h-8 pl-8 pr-8 text-sm bg-slate-100/60 hover:bg-slate-100 focus:bg-white placeholder:text-slate-400 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg outline-none transition-all duration-150"
          />
          <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-400">
            <Icon icon="lucide:search" width={14} height={14} />
          </div>
          {queryValue && (
            <button
              onClick={() => setQueryValue('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 cursor-pointer bg-transparent border-none flex items-center justify-center"
            >
              <Icon icon="lucide:x" width={12} height={12} />
            </button>
          )}
        </div>
      </div>

      {/* Locations Table list */}
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Danh sách vị trí">
            <Table.Header>
              <Table.Column isRowHeader>Tên vị trí</Table.Column>
              <Table.Column>Mã QG</Table.Column>
              <Table.Column>Sử dụng</Table.Column>
              <Table.Column className="text-end">Thao tác</Table.Column>
            </Table.Header>
            <Table.Body>
              {filteredLocations.map((loc) => (
                <Table.Row key={loc.id}>
                  <Table.Cell className="align-top  font-semibold text-slate-800 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Image 
                        src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${loc.countryCode.toUpperCase()}.svg`} 
                        width={18} 
                        height={12}
                        alt={loc.countryCode}
                        style={{ 
                          borderRadius: '1px', 
                          border: '1px solid #E2E8F0',
                          display: 'block' 
                        }}
                      />
                      <span className="font-medium text-slate-700">{loc.name}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell className="align-top">
                    <Chip size="sm" variant="soft" color="accent" className="font-medium text-[10px] uppercase">
                      {loc.countryCode}
                    </Chip>
                  </Table.Cell>
                  <Table.Cell className="align-top text-slate-500">
                    {loc._count?.servers || 0} máy chủ
                  </Table.Cell>
                  <Table.Cell className="align-top text-right">
                    <button
                      onClick={() => setDeleteLoc(loc)}
                      className="w-7 h-7 rounded-md bg-transparent hover:bg-red-50 text-red-400 hover:text-red-600 border-none flex items-center justify-center cursor-pointer transition-colors inline-flex"
                      title="Xóa vị trí"
                    >
                      <Icon icon="lucide:trash-2" className="w-3.5 h-3.5" />
                    </button>
                  </Table.Cell>
                </Table.Row>
              ))}
              {filteredLocations.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                    Danh sách vị trí hiện đang trống.
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      {/* Modern Compact Overlay Modal for Add Location */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm overflow-hidden shadow-lg flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800">
                Thêm vị trí mới
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors bg-transparent border-none flex items-center justify-center"
              >
                <Icon icon="lucide:x" className="w-4 h-4" />
              </button>
            </div>
            {/* Modal Body */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3.5 text-xs bg-white">
              {/* Tên vị trí */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-500">Tên vị trí</label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="text"
                      placeholder="Ví dụ: Việt Nam, Hoa Kỳ..."
                      value={field.value}
                      onChange={field.onChange}
                      className={`w-full h-9 text-sm bg-white outline-none`}
                    />
                  )}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500 font-medium">{errors.name.message}</p>
                )}
              </div>

              {/* Mã quốc gia */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-500">Mã quốc gia (ISO 3166-1 alpha-2)</label>
                <Controller
                  name="countryCode"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="text"
                      placeholder="VN, US, UK, SG..."
                      value={field.value}
                      onChange={field.onChange}
                      className={`w-full h-9 text-sm bg-white outline-none`}
                    />
                  )}
                />
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed font-medium">
                  Sử dụng 2 ký tự mã quốc gia để hiển thị icon cờ tự động.
                </p>
                {errors.countryCode && (
                  <p className="mt-1 text-sm text-red-500 font-medium">{errors.countryCode.message}</p>
                )}
              </div>
            </form>
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <Button
                size="sm"
                onPress={() => setIsModalOpen(false)}
                className="cursor-pointer font-medium text-sm h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-600"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onPress={() => handleSubmit(onSubmit)()}
                isDisabled={isSubmitting}
                className="cursor-pointer font-medium text-sm h-9 px-3 rounded-lg flex items-center gap-1.5 bg-blue-600 text-white"
              >
                {isSubmitting && (
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
                Lưu vị trí
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Compact Overlay Modal for Deleting Location */}
      {deleteLoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm overflow-hidden shadow-lg flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 text-danger">
                <Icon icon="lucide:alert-triangle" className="w-4 h-4 shrink-0 text-red-500" />
                Xóa vị trí?
              </h3>
              <button 
                onClick={() => setDeleteLoc(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors bg-transparent border-none flex items-center justify-center"
              >
                <Icon icon="lucide:x" className="w-4 h-4" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-4 text-xs text-slate-600 font-medium leading-relaxed bg-white">
              Bạn có chắc chắn muốn xóa vị trí <b>{deleteLoc.name}</b>? Tác vụ này sẽ gỡ bỏ vị trí khỏi danh sách chọn vị trí của máy chủ.
            </div>
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <Button
                size="sm"
                onPress={() => setDeleteLoc(null)}
                className="cursor-pointer font-medium text-sm h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-600"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                variant="danger"
                onPress={handleDelete}
                isDisabled={isDeleting !== null}
                className="cursor-pointer font-medium text-sm h-9 px-3 rounded-lg flex items-center gap-1.5 bg-red-500 text-white"
              >
                {isDeleting && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
